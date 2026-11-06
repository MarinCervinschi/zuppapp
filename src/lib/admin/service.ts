import { and, eq, inArray, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { products } from "@/db/schema";
import { productImageUrl } from "@/lib/catalog/image";
import { openReportsCount } from "@/lib/reports/service";
import { matchesText } from "@/lib/search/service";
import { NotFound } from "@/lib/server/errors";

import {
	ADMIN_PAGE_SIZE,
	type AdminListParams,
	NO_SUBTYPE,
	type ProductCorrection,
} from "./schemas";

type Status = "draft" | "published" | "archived";

export type AdminProduct = {
	id: string;
	ean: string;
	name: string;
	brand: string | null;
	subtype: string | null;
	quantity: string | null;
	producerUrl: string | null;
	status: Status;
	imageUrl: string | null;
	/** The fields an admin corrected, which the Open Food Facts sync leaves alone. */
	corrected: string[];
	votesCount: number;
};

/** What each tab of the admin holds: products by status, and EANs with open reports. */
export type AdminCounts = Record<Status | "reports", number>;

export type AdminPage = {
	items: AdminProduct[];
	counts: AdminCounts;
	/** The types in this tab with how many products each, for the type filter. */
	subtypes: { value: string; count: number }[];
	status: Status;
	total: number;
	page: number;
	pageCount: number;
};

export async function adminCounts(): Promise<AdminCounts> {
	const [rows, reports] = await Promise.all([
		getDb()
			.select({ status: products.status, count: sql<number>`count(*)::int` })
			.from(products)
			.groupBy(products.status),
		openReportsCount(),
	]);
	const counts: AdminCounts = { draft: 0, published: 0, archived: 0, reports };
	for (const row of rows) counts[row.status] = row.count;
	return counts;
}

// The photo a row shows: ours, else the one of the latest Open Food Facts snapshot.
const OFF_IMAGE = sql`(SELECT image_url FROM product_snapshots s WHERE s.product_id = products.id
	ORDER BY s.fetched_at DESC LIMIT 1)`;

const ORDER = {
	queue: sql`products.subtype NULLS FIRST, products.name`,
	nome: sql`products.name`,
	voti: sql`coalesce(ps.votes_count, 0) DESC, products.name`,
	recenti: sql`products.created_at DESC`,
	modificati: sql`products.updated_at DESC`,
};

/** The filters of the list, as SQL conditions, besides the status. */
function filterConditions(params: AdminListParams) {
	const conditions = [];
	const q = params.q;
	// Digits are an EAN, or its start: the product page links here with its own.
	if (q && /^\d+$/.test(q)) conditions.push(sql`products.ean LIKE ${`${q}%`}`);
	else if (q) conditions.push(matchesText(q));

	if (params.tipo === NO_SUBTYPE) conditions.push(sql`products.subtype IS NULL`);
	else if (params.tipo) conditions.push(sql`products.subtype = ${params.tipo}`);

	const hasPhoto = sql`coalesce(products.image_key, ${OFF_IMAGE}) IS NOT NULL`;
	if (params.foto === "si") conditions.push(hasPhoto);
	if (params.foto === "no") conditions.push(sql`NOT ${hasPhoto}`);

	if (params.voti === "si") conditions.push(sql`coalesce(ps.votes_count, 0) > 0`);
	if (params.voti === "no") conditions.push(sql`coalesce(ps.votes_count, 0) = 0`);

	if (params.corretti === "si") conditions.push(sql`products.overrides <> '{}'::jsonb`);
	if (params.corretti === "no") conditions.push(sql`products.overrides = '{}'::jsonb`);
	return conditions;
}

/** The products of one status, drafts first by default: the queue an admin works through. */
export async function listForAdmin(params: AdminListParams): Promise<AdminPage> {
	const db = getDb();
	const status = params.stato ?? "draft";
	const page = params.pagina ?? 1;
	const conditions = [sql`products.status = ${status}`, ...filterConditions(params)];

	const [rows, counts, subtypes] = await Promise.all([
		db.execute<{
			id: string;
			ean: string;
			name: string;
			brand: string | null;
			subtype: string | null;
			quantity: string | null;
			producer_url: string | null;
			status: Status;
			image_key: string | null;
			off_image_url: string | null;
			overrides: Record<string, unknown>;
			votes_count: number;
			total: number;
		}>(sql`
			SELECT products.id, products.ean, products.name, products.brand, products.subtype,
				products.quantity, products.producer_url, products.status, products.image_key,
				products.overrides,
				${OFF_IMAGE} AS off_image_url,
				coalesce(ps.votes_count, 0)::int AS votes_count,
				count(*) OVER ()::int AS total
			FROM products
			LEFT JOIN product_stats ps ON ps.product_id = products.id
			WHERE ${sql.join(conditions, sql` AND `)}
			ORDER BY ${ORDER[params.ordine ?? "queue"]}
			LIMIT ${ADMIN_PAGE_SIZE} OFFSET ${(page - 1) * ADMIN_PAGE_SIZE}
		`),
		adminCounts(),
		db
			.select({ value: products.subtype, count: sql<number>`count(*)::int` })
			.from(products)
			.where(eq(products.status, status))
			.groupBy(products.subtype)
			.orderBy(products.subtype),
	]);
	const total = rows.rows[0]?.total ?? 0;

	return {
		items: rows.rows.map(row => ({
			id: row.id,
			ean: row.ean,
			name: row.name,
			brand: row.brand,
			subtype: row.subtype,
			quantity: row.quantity,
			producerUrl: row.producer_url,
			status: row.status,
			imageUrl: productImageUrl(row.image_key) ?? row.off_image_url,
			corrected: Object.keys(row.overrides ?? {}),
			votesCount: row.votes_count,
		})),
		counts,
		subtypes: subtypes.map(row => ({
			value: row.value ?? NO_SUBTYPE,
			count: row.count,
		})),
		status,
		total,
		page,
		pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
	};
}

/** Publishes, archives or sends back to draft many products at once. */
export async function setProductsStatus(ids: string[], status: Status) {
	const updated = await getDb()
		.update(products)
		.set({ status, updatedAt: sql`now()` })
		.where(inArray(products.id, ids))
		.returning({ id: products.id });
	return { updated: updated.length };
}

// Corrections of the fields Open Food Facts also writes are kept in `overrides`, so the
// sync never undoes them. The producer's site is ours alone and needs no override.
const SYNCED_FIELDS = ["name", "brand", "subtype"] as const;

export async function correctProduct(input: ProductCorrection) {
	const db = getDb();
	await db.transaction(async tx => {
		const [current] = await tx
			.select()
			.from(products)
			.where(eq(products.id, input.id))
			.for("update");
		if (!current) throw new NotFound("Prodotto non trovato");

		const overrides = { ...current.overrides };
		for (const field of SYNCED_FIELDS) {
			if (input[field] !== current[field]) overrides[field] = input[field];
		}

		await tx
			.update(products)
			.set({
				name: input.name,
				brand: input.brand,
				subtype: input.subtype,
				producerUrl: input.producerUrl,
				overrides,
				updatedAt: sql`now()`,
			})
			.where(and(eq(products.id, input.id)));
	});
}
