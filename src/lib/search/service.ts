import { type SQL, sql } from "drizzle-orm";

// The only module that knows the search runs on ParadeDB. Drizzle has no operators for
// pg_search, so these are raw SQL fragments over the `products` table; swapping in Postgres
// full-text plus pg_trgm means rewriting this file and the 0001 migration, nothing else.

// One edit, a swap counting as one, catches "minestorne"; prefix matching (the first `t`)
// makes results appear while typing. Distance 2 also matched "zu" to "minestrone".
const FUZZY_DISTANCE = 1;

/** True for products matching the text: name, brand and subtype forgive typos; ingredients are exact. */
export function matchesText(text: string): SQL {
	const fuzzy = sql`${text}::pdb.fuzzy(${sql.raw(String(FUZZY_DISTANCE))}, t, t)`;
	return sql`(
		products.name ||| ${fuzzy}
		OR products.brand ||| ${fuzzy}
		OR products.subtype ||| ${fuzzy}
		OR products.ingredients_text ||| ${text}
	)`;
}

/** BM25 relevance of the current row; only meaningful in a query filtered by `matchesText`. */
export const relevance: SQL = sql`pdb.score(products.id)`;
