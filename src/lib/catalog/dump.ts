import { asc, desc, eq, ne } from "drizzle-orm";

import { getDb } from "@/db";
import { categories, productSnapshots, products, retailerLinks } from "@/db/schema";
import { decodeEntities } from "@/lib/entities";

export const DUMP_FILE_NAME = "zuppapp-catalogo.json";

/** One product as the dump publishes it: the label's facts, never votes or who corrected what. */
export type DumpProduct = {
	ean: string;
	name: string;
	brand: string | null;
	quantity: string | null;
	category: string;
	subtype: string | null;
	/** `archived` is out of production: still in the catalogue, out of the ranking. */
	status: "published" | "archived";
	ingredients: string | null;
	allergens: string[];
	nutriscore: string | null;
	nova: number | null;
	/** Open Food Facts' keys, as on the label (`energy-kcal_100g`, `salt_100g`, …). */
	nutriments: Record<string, number> | null;
	producerUrl: string | null;
	retailers: { retailer: string; url: string }[];
	openFoodFactsUrl: string;
	updatedAt: string;
};

export type CatalogDump = {
	name: string;
	licence: string;
	licenceUrl: string;
	attribution: string;
	generatedAt: string;
	products: DumpProduct[];
};

/**
 * The catalogue as an ODbL dump, as SPEC decision 11 asks: the products are built from Open
 * Food Facts, whose database is ODbL, so ours is shared under the same licence. Votes, tags,
 * users and reports are not part of it. Photos are left out too: they are CC BY-SA, not ODbL,
 * and stay on Open Food Facts.
 */
export async function getCatalogDump(): Promise<CatalogDump> {
	const db = getDb();
	const [rows, snapshots, retailers] = await Promise.all([
		db
			.select({ product: products, category: categories.name })
			.from(products)
			.innerJoin(categories, eq(categories.id, products.categoryId))
			.where(ne(products.status, "draft"))
			.orderBy(asc(products.ean)),
		// The latest snapshot of every product: what the label said at the last sync.
		db
			.selectDistinctOn([productSnapshots.productId], {
				productId: productSnapshots.productId,
				nutriments: productSnapshots.nutriments,
				nova: productSnapshots.nova,
			})
			.from(productSnapshots)
			.orderBy(productSnapshots.productId, desc(productSnapshots.fetchedAt)),
		db
			.select({
				productId: retailerLinks.productId,
				retailer: retailerLinks.retailer,
				url: retailerLinks.url,
			})
			.from(retailerLinks)
			.orderBy(asc(retailerLinks.position)),
	]);
	const snapshotOf = new Map(snapshots.map(row => [row.productId, row]));

	return {
		name: "Zuppapp: catalogo delle zuppe",
		licence: "Open Database License (ODbL) v1.0",
		licenceUrl: "https://opendatacommons.org/licenses/odbl/1-0/",
		attribution:
			"Dati da Open Food Facts (https://world.openfoodfacts.org), con le correzioni di Zuppapp.",
		generatedAt: new Date().toISOString(),
		products: rows.flatMap(({ product, category }) => {
			if (product.status === "draft") return [];
			const snapshot = snapshotOf.get(product.id);
			return [
				{
					ean: product.ean,
					name: product.name,
					brand: product.brand,
					quantity: product.quantity,
					category,
					subtype: product.subtype,
					status: product.status,
					ingredients: product.ingredientsText
						? decodeEntities(product.ingredientsText)
						: null,
					allergens: product.allergens,
					nutriscore: product.nutriscore,
					nova: snapshot?.nova ?? null,
					nutriments: snapshot?.nutriments ?? null,
					producerUrl: product.producerUrl,
					retailers: retailers
						.filter(link => link.productId === product.id)
						.map(({ retailer, url }) => ({ retailer, url })),
					openFoodFactsUrl: `https://world.openfoodfacts.org/product/${product.ean}`,
					updatedAt: product.updatedAt.toISOString(),
				},
			];
		}),
	};
}
