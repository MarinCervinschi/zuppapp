import { sql } from "drizzle-orm";

import { getDb } from "@/db";
import { MIN_VOTES_TO_RANK, meanStars } from "@/lib/ranking/rules";
import { matchesText, relevance } from "@/lib/search/service";

import { productImageUrl } from "./image";

export type Suggestions = {
	products: {
		ean: string;
		name: string;
		brand: string | null;
		imageUrl: string | null;
		/** The mean of the stars once the soup is ranked; null before. */
		mean: number | null;
	}[];
	subtypes: { value: string; count: number }[];
	brands: { value: string; count: number }[];
};

// At most eight rows in all on a phone: five soups, two types, two brands are already plenty.
const PRODUCTS = 5;
const SUBTYPES = 2;
const BRANDS = 2;

/**
 * What the search box offers while you type: soups (names starting with the text first, then by
 * relevance), then types and brands that match.
 */
export async function suggest(text: string): Promise<Suggestions> {
	const db = getDb();
	const prefix = `${text.toLowerCase()}%`;
	const anywhere = `%${text.toLowerCase()}%`;

	const [products, subtypes, brands] = await Promise.all([
		db.execute<{
			ean: string;
			name: string;
			brand: string | null;
			image_key: string | null;
			off_image_url: string | null;
			votes_count: number;
			score_sum: number;
		}>(sql`
			SELECT products.ean, products.name, products.brand, products.image_key,
				(SELECT image_url FROM product_snapshots s WHERE s.product_id = products.id
					ORDER BY s.fetched_at DESC LIMIT 1) AS off_image_url,
				coalesce(ps.votes_count, 0)::int AS votes_count,
				coalesce(ps.score_sum, 0)::int AS score_sum
			FROM products
			LEFT JOIN product_stats ps ON ps.product_id = products.id
			WHERE products.status = 'published' AND ${matchesText(text)}
			ORDER BY (lower(products.name) LIKE ${prefix}) DESC, ${relevance} DESC, products.name
			LIMIT ${PRODUCTS}
		`),
		// The types are few and their words fixed ("minestrone"): a prefix is enough.
		db.execute<{ value: string; count: number }>(sql`
			SELECT subtype AS value, count(*)::int AS count FROM products
			WHERE status = 'published' AND lower(subtype) LIKE ${prefix}
			GROUP BY 1 ORDER BY 2 DESC LIMIT ${SUBTYPES}
		`),
		db.execute<{ value: string; count: number }>(sql`
			SELECT brand AS value, count(*)::int AS count FROM products
			WHERE status = 'published' AND lower(brand) LIKE ${anywhere}
			GROUP BY 1 ORDER BY 2 DESC LIMIT ${BRANDS}
		`),
	]);

	return {
		products: products.rows.map(row => ({
			ean: row.ean,
			name: row.name,
			brand: row.brand,
			imageUrl: productImageUrl(row.image_key) ?? row.off_image_url,
			mean:
				row.votes_count >= MIN_VOTES_TO_RANK
					? meanStars(row.score_sum, row.votes_count)
					: null,
		})),
		subtypes: subtypes.rows,
		brands: brands.rows,
	};
}
