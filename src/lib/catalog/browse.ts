import { type SQL, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { FAVORITES_PAGE_SIZE } from "@/lib/favorites/schemas";
import {
	MIN_VOTES_TO_RANK,
	PRIOR_VOTES,
	SCORES,
	type Score,
	isScore,
	meanStars,
} from "@/lib/ranking/rules";
import { matchesText, relevance } from "@/lib/search/service";

import { productImageUrl } from "./image";
import {
	type BrowseParams,
	PODIUM_SIZE,
	ROW_PAGE_SIZES,
	TILE_PAGE_SIZES,
	listParam,
} from "./schemas";
import type {
	FacetValue,
	Facets,
	ListPage,
	ProductListItem,
	RankingPage,
} from "./types";

// The public catalogue, in three cuts: the ranking (enough votes, by Bayesian score),
// the shelf still to taste (not enough votes yet) and search results (by relevance).

// With no vote anywhere yet, the prior is the middle star.
const NEUTRAL_MEAN = 3;

type Row = {
	id: string;
	ean: string;
	name: string;
	brand: string | null;
	subtype: string | null;
	quantity: string | null;
	image_key: string | null;
	off_image_url: string | null;
	votes_count: number;
	score_sum: number;
	score_counts: Record<string, number> | null;
	my_score: number | null;
	total: number;
};

function filtersOf(params: BrowseParams, skip?: "tipo" | "marca" | "nutri") {
	const conditions = [sql`products.status = 'published'`];
	if (params.q) conditions.push(matchesText(params.q));
	if (params.tipo && skip !== "tipo")
		conditions.push(sql`products.subtype = ${params.tipo}`);
	if (params.marca && skip !== "marca")
		conditions.push(sql`products.brand = ${params.marca}`);
	const nutri = listParam(params.nutri);
	if (nutri.length > 0 && skip !== "nutri") {
		conditions.push(
			sql`products.nutriscore IN (${sql.join(
				nutri.map(n => sql`${n}`),
				sql`, `
			)})`
		);
	}
	// "Senza latte": products that declare none of the chosen allergens.
	const without = listParam(params.senza);
	if (without.length > 0) {
		conditions.push(
			sql`NOT (products.allergens && ARRAY[${sql.join(
				without.map(a => sql`${a}`),
				sql`, `
			)}]::text[])`
		);
	}
	return sql.join(conditions, sql` AND `);
}

function select(userId: string | null) {
	return sql`
		products.id, products.ean, products.name, products.brand, products.subtype,
		products.quantity, products.image_key,
		(SELECT image_url FROM product_snapshots s WHERE s.product_id = products.id
			ORDER BY s.fetched_at DESC LIMIT 1) AS off_image_url,
		coalesce(ps.votes_count, 0)::int AS votes_count,
		coalesce(ps.score_sum, 0)::int AS score_sum,
		ps.score_counts,
		${
			userId
				? sql`(SELECT score FROM votes v WHERE v.product_id = products.id AND v.user_id = ${userId})`
				: sql`NULL`
		}::int AS my_score,
		count(*) OVER ()::int AS total`;
}

/**
 * The ranking orders by the figure every badge prints, the mean of the stars, made Bayesian:
 * each product starts with PRIOR_VOTES fake votes at the mean of all votes, so a 5.0 from 7
 * votes cannot beat a 4.8 from 40 by luck. The formula is bayesMean in ranking/rules.ts.
 */
export async function bayesScore() {
	const [{ mean }] = (
		await getDb().execute<{ mean: number }>(sql`
			SELECT coalesce(sum(score_sum)::float / nullif(sum(votes_count), 0), ${NEUTRAL_MEAN}) AS mean
			FROM product_stats
		`)
	).rows;
	return sql`(${PRIOR_VOTES} * ${mean}::float + coalesce(ps.score_sum, 0)) / (${PRIOR_VOTES} + coalesce(ps.votes_count, 0))`;
}

function toItem(row: Row, rank: number | null): ProductListItem {
	const scoreCounts = Object.fromEntries(
		SCORES.map(score => [score, row.score_counts?.[String(score)] ?? 0])
	) as Record<Score, number>;
	return {
		id: row.id,
		ean: row.ean,
		name: row.name,
		brand: row.brand,
		subtype: row.subtype,
		quantity: row.quantity,
		imageUrl: productImageUrl(row.image_key) ?? row.off_image_url,
		votesCount: row.votes_count,
		mean: meanStars(row.score_sum, row.votes_count),
		scoreCounts,
		rank,
		myScore: row.my_score !== null && isScore(row.my_score) ? row.my_score : null,
	};
}

async function query(
	where: SQL,
	orderBy: SQL,
	limit: number,
	offset: number,
	userId: string | null
) {
	return (
		await getDb().execute<Row>(sql`
			SELECT ${select(userId)}
			FROM products
			LEFT JOIN product_stats ps ON ps.product_id = products.id
			WHERE ${where}
			ORDER BY ${orderBy}
			LIMIT ${limit} OFFSET ${offset}
		`)
	).rows;
}

/**
 * The ranking, one page of places at a time: "10 per page" means ten places, podium included.
 * Page 1 holds places 1 to 10, the first three of them on the podium; page 2 holds 11 to 20.
 */
export async function getRanking(params: BrowseParams): Promise<RankingPage> {
	const page = params.posti ?? 1;
	const size = params.righe ?? ROW_PAGE_SIZES[0];
	const where = sql`${filtersOf(params)} AND coalesce(ps.votes_count, 0) >= ${MIN_VOTES_TO_RANK}`;
	const order = sql`${await bayesScore()} DESC, coalesce(ps.votes_count, 0) DESC, products.name`;
	const offset = (page - 1) * size;

	const rows = (await query(where, order, size, offset, null)).map((row, index) =>
		toItem(row, offset + index + 1)
	);
	const total = (await query(where, order, 1, 0, null))[0]?.total ?? 0;
	const onPodium = page === 1 ? PODIUM_SIZE : 0;
	return {
		podium: rows.slice(0, onPodium),
		rows: rows.slice(onPodium),
		total,
		page,
		pageSize: size,
		pageCount: Math.max(1, Math.ceil(total / size)),
	};
}

/**
 * Products still short of the votes the ranking needs, those closest to entering it first:
 * one more vote puts them on the board.
 */
export async function getToTaste(
	params: BrowseParams,
	userId: string | null
): Promise<ListPage> {
	const page = params.pagina ?? 1;
	const size = params.mostra ?? TILE_PAGE_SIZES[0];
	const rows = await query(
		sql`${filtersOf(params)} AND coalesce(ps.votes_count, 0) < ${MIN_VOTES_TO_RANK}`,
		sql`coalesce(ps.votes_count, 0) DESC, products.name`,
		size,
		(page - 1) * size,
		userId
	);
	return pageOf(
		rows.map(row => toItem(row, null)),
		rows,
		page,
		size
	);
}

/** Search results, most relevant first, ranked or not; with no text, the whole shelf by name. */
export async function searchCatalog(
	params: BrowseParams,
	userId: string | null
): Promise<ListPage> {
	const page = params.pagina ?? 1;
	const size = params.mostra ?? TILE_PAGE_SIZES[0];
	const rows = await query(
		filtersOf(params),
		params.q ? sql`${relevance} DESC, products.name` : sql`products.name`,
		size,
		(page - 1) * size,
		userId
	);
	return pageOf(
		rows.map(row => toItem(row, null)),
		rows,
		page,
		size
	);
}

/**
 * «I tuoi preferiti»: the products the reader keeps a heart on, newest heart first, as cards.
 * Archived ones stay (they were kept on purpose); drafts never show.
 */
export async function getFavoritesPage(
	userId: string,
	page: number
): Promise<ListPage> {
	const size = FAVORITES_PAGE_SIZE;
	const kept = sql`(SELECT f.created_at FROM favorites f WHERE f.product_id = products.id AND f.user_id = ${userId})`;
	const rows = await query(
		sql`products.status <> 'draft' AND ${kept} IS NOT NULL`,
		sql`${kept} DESC`,
		size,
		(page - 1) * size,
		userId
	);
	return pageOf(
		rows.map(row => toItem(row, null)),
		rows,
		page,
		size
	);
}

function pageOf(
	items: ProductListItem[],
	rows: Row[],
	page: number,
	size: number
): ListPage {
	const total = rows[0]?.total ?? 0;
	return {
		items,
		total,
		page,
		pageSize: size,
		pageCount: Math.max(1, Math.ceil(total / size)),
	};
}

/** The counts each filter shows, each computed without its own filter so options never vanish. */
export async function getFacets(params: BrowseParams): Promise<Facets> {
	const facet = async (column: SQL, where: SQL) =>
		(
			await getDb().execute<FacetValue>(sql`
				SELECT ${column} AS value, count(*)::int AS count
				FROM products
				WHERE ${where} AND ${column} IS NOT NULL
				GROUP BY 1 ORDER BY 2 DESC, 1 LIMIT 300
			`)
		).rows;

	const countWhere = (where: SQL) =>
		getDb()
			.execute<{ total: number }>(
				sql`SELECT count(*)::int AS total FROM products WHERE ${where}`
			)
			.then(result => result.rows[0]?.total ?? 0);

	const [subtypes, brands, nutriscores, total, anyType] = await Promise.all([
		facet(sql`products.subtype`, filtersOf(params, "tipo")),
		facet(sql`products.brand`, filtersOf(params, "marca")),
		facet(sql`products.nutriscore`, filtersOf(params, "nutri")),
		countWhere(filtersOf(params)),
		params.tipo ? countWhere(filtersOf(params, "tipo")) : null,
	]);
	return { subtypes, brands, nutriscores, total, anyType: anyType ?? total };
}
