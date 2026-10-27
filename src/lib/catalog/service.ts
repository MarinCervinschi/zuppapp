import { and, asc, desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import {
	categories,
	productSnapshots,
	productStats,
	products,
	retailerLinks,
	tags,
	voteTags,
	votes,
} from "@/db/schema";
import {
	MIN_VOTES_TO_RANK,
	type Score,
	isRanked,
	isScore,
	rebuyPercent,
} from "@/lib/ranking/rules";
import { decodeEntities } from "@/lib/entities";
import { NotFound } from "@/lib/server/errors";

import { bayesRebuyShare } from "./browse";
import { productImageUrl } from "./image";
import type { Nutrition, ProductCard, ProductStatsView, TagOption } from "./types";

// Snapshots imported before map.ts decoded entities still carry them.
const decodeOrNull = (text: string | null) => (text ? decodeEntities(text) : null);

// Open Food Facts' keys, per 100 g.
function readNutrition(nutriments: Record<string, number> | null): Nutrition | null {
	if (!nutriments) return null;
	const pick = (key: string) =>
		typeof nutriments[key] === "number" ? nutriments[key] : null;
	const nutrition = {
		energyKcal: pick("energy-kcal_100g"),
		fat: pick("fat_100g"),
		saturatedFat: pick("saturated-fat_100g"),
		carbohydrates: pick("carbohydrates_100g"),
		sugars: pick("sugars_100g"),
		proteins: pick("proteins_100g"),
		salt: pick("salt_100g"),
	};
	return Object.values(nutrition).some(value => value !== null) ? nutrition : null;
}

function statsView(
	scoreCounts: Record<Score, number>,
	row: {
		votesCount: number;
		votesRegistered: number;
		scoreSum: number;
		rebuyCount: number;
		tagCounts: Record<string, number>;
	} | null,
	tagOptions: TagOption[]
): ProductStatsView {
	const votesCount = row?.votesCount ?? 0;
	const mean = votesCount > 0 ? row!.scoreSum / votesCount : null;
	const meanFace = mean === null ? null : Math.round(mean);
	const counts = row?.tagCounts ?? {};

	return {
		votesCount,
		rank: null,
		votesRegistered: row?.votesRegistered ?? 0,
		ranked: isRanked(votesCount),
		meanFace: meanFace !== null && isScore(meanFace) ? meanFace : null,
		rebuyPercent: rebuyPercent(row?.rebuyCount ?? 0, votesCount),
		scoreCounts,
		tags: tagOptions
			.filter(tag => (counts[tag.slug] ?? 0) > 0)
			.map(tag => ({
				...tag,
				count: counts[tag.slug],
				percent: Math.round((counts[tag.slug] / votesCount) * 100),
			}))
			.sort((a, b) => b.count - a.count),
	};
}

export async function getProductCard(
	ean: string,
	userId: string | null
): Promise<ProductCard> {
	const db = getDb();

	const [product] = await db
		.select({ product: products, categoryName: categories.name })
		.from(products)
		.innerJoin(categories, eq(categories.id, products.categoryId))
		.where(and(eq(products.ean, ean), sql`${products.status} <> 'draft'`));
	if (!product) throw new NotFound("Prodotto non trovato");
	const { id } = product.product;

	const [[snapshot], retailers, [stats], tagOptions, myVote, scoreRows] =
		await Promise.all([
			db
				.select()
				.from(productSnapshots)
				.where(eq(productSnapshots.productId, id))
				.orderBy(desc(productSnapshots.fetchedAt))
				.limit(1),
			db
				.select({ retailer: retailerLinks.retailer, url: retailerLinks.url })
				.from(retailerLinks)
				.where(eq(retailerLinks.productId, id))
				.orderBy(asc(retailerLinks.position)),
			db.select().from(productStats).where(eq(productStats.productId, id)),
			db
				.select({
					id: tags.id,
					slug: tags.slug,
					label: tags.label,
					sentiment: tags.sentiment,
				})
				.from(tags)
				.where(eq(tags.active, true))
				.orderBy(asc(tags.position)),
			userId ? readMyVote(id, userId) : Promise.resolve(null),
			db
				.select({ score: votes.score, count: sql<number>`count(*)::int` })
				.from(votes)
				.where(eq(votes.productId, id))
				.groupBy(votes.score),
		]);
	const rank = isRanked(stats?.votesCount ?? 0) ? await rankOf(id) : null;
	const scoreCounts: Record<Score, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
	for (const row of scoreRows)
		if (isScore(row.score)) scoreCounts[row.score] = row.count;

	return {
		id,
		ean: product.product.ean,
		name: product.product.name,
		brand: product.product.brand,
		quantity: product.product.quantity,
		subtype: product.product.subtype,
		categoryName: product.categoryName,
		imageUrl: productImageUrl(product.product.imageKey) ?? snapshot?.imageUrl ?? null,
		producerUrl: product.product.producerUrl,
		retailers,
		ingredientsText: decodeOrNull(
			product.product.ingredientsText ?? snapshot?.ingredientsText ?? null
		),
		allergens: snapshot?.allergens ?? [],
		nutrition: readNutrition(snapshot?.nutriments ?? null),
		nutriscore: snapshot?.nutriscore ?? null,
		nova: snapshot?.nova ?? null,
		recipeChangedAt: product.product.recipeChangedAt?.toISOString() ?? null,
		archived: product.product.status === "archived",
		stats: { ...statsView(scoreCounts, stats ?? null, tagOptions), rank },
		tagOptions,
		myVote,
	};
}

async function readMyVote(
	productId: string,
	userId: string
): Promise<{ score: Score; tagIds: string[] } | null> {
	const db = getDb();
	const [vote] = await db
		.select({ score: votes.score })
		.from(votes)
		.where(and(eq(votes.productId, productId), eq(votes.userId, userId)));
	if (!vote || !isScore(vote.score)) return null;

	const tagRows = await db
		.select({ tagId: voteTags.tagId })
		.from(voteTags)
		.where(and(eq(voteTags.productId, productId), eq(voteTags.userId, userId)));
	return { score: vote.score, tagIds: tagRows.map(row => row.tagId) };
}

/** Where a ranked product stands: one plus the published, ranked products ordered above it. */
async function rankOf(productId: string): Promise<number> {
	const order = await bayesRebuyShare();
	const [{ rank }] = (
		await getDb().execute<{ rank: number }>(sql`
			WITH ranked AS (
				SELECT products.id, ${order} AS share
				FROM products JOIN product_stats ps ON ps.product_id = products.id
				WHERE products.status = 'published' AND ps.votes_count >= ${MIN_VOTES_TO_RANK}
			)
			SELECT 1 + count(*)::int AS rank FROM ranked
			WHERE share > (SELECT share FROM ranked WHERE id = ${productId})
		`)
	).rows;
	return rank;
}
