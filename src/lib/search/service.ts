import { sql } from "drizzle-orm";

import type { DbOrTx } from "@/db";

// The only module that knows the search runs on ParadeDB. Drizzle has no operators for
// pg_search, so the queries are raw SQL; swapping in Postgres full-text plus pg_trgm
// means rewriting this file and the 0001 migration, nothing else.

export type SearchFilters = {
	categoryId?: string;
	subtype?: string;
	limit?: number;
};

export type SearchHit = {
	id: string;
	name: string;
	brand: string | null;
	subtype: string | null;
	score: number;
};

const DEFAULT_LIMIT = 20;
// One edit, a swap counting as one, catches "minestorne"; prefix matching (the first `t`)
// makes results appear while typing. Distance 2 also matched "zu" to "minestrone".
const FUZZY_DISTANCE = 1;

export async function searchProducts(
	db: DbOrTx,
	text: string,
	filters: SearchFilters = {}
): Promise<SearchHit[]> {
	const query = text.trim();
	if (!query) return [];

	const limit = filters.limit ?? DEFAULT_LIMIT;
	const fuzzy = sql`${query}::pdb.fuzzy(${sql.raw(String(FUZZY_DISTANCE))}, t, t)`;

	const result = await db.execute<SearchHit>(sql`
		SELECT id, name, brand, subtype, pdb.score(id) AS score
		FROM products
		WHERE (
			name ||| ${fuzzy}
			OR brand ||| ${fuzzy}
			OR subtype ||| ${fuzzy}
			OR ingredients_text ||| ${query}
		)
		AND status = 'published'
		${filters.categoryId ? sql`AND category_id = ${filters.categoryId}` : sql``}
		${filters.subtype ? sql`AND subtype = ${filters.subtype}` : sql``}
		ORDER BY pdb.score(id) DESC
		LIMIT ${limit}
	`);

	return result.rows.map(row => ({ ...row, score: Number(row.score) }));
}
