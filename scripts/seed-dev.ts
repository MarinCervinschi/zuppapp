// Example products for a local database, so the cards and the voting can be tried before the
// Open Food Facts import exists. EANs start with 2, the range reserved for in-store codes, so
// they can never clash with a real product; the check digits are valid, so the barcodes scan.
// Never run it against production.
import { eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { categories, productSnapshots, products } from "@/db/schema";

import { assertLocalDatabase } from "./lib/local-db";

type Example = {
	ean: string;
	name: string;
	brand: string;
	subtype: string;
	quantity: string;
	ingredients: string;
	nutriments: Record<string, number>;
	nutriscore: string;
	nova: number;
};

const EXAMPLES: Example[] = [
	{
		ean: "2000000000015",
		name: "Vellutata di zucca (esempio)",
		brand: "Marca Esempio",
		subtype: "vellutata",
		quantity: "620 g",
		ingredients: "Zucca 45%, acqua, patate, cipolla, olio extravergine di oliva, sale.",
		nutriments: {
			"energy-kcal_100g": 42,
			fat_100g: 1.8,
			"saturated-fat_100g": 0.3,
			carbohydrates_100g: 5.4,
			sugars_100g: 2.1,
			proteins_100g: 0.9,
			salt_100g: 0.7,
		},
		nutriscore: "a",
		nova: 3,
	},
	{
		ean: "2000000000022",
		name: "Minestrone tradizionale (esempio)",
		brand: "Marca Esempio",
		subtype: "minestrone",
		quantity: "620 g",
		ingredients:
			"Acqua, carote, zucchine, fagioli borlotti, patate, sedano, piselli, cavolo, olio di girasole, sale.",
		nutriments: {
			"energy-kcal_100g": 38,
			fat_100g: 1.2,
			carbohydrates_100g: 4.9,
			sugars_100g: 1.7,
			proteins_100g: 1.6,
			salt_100g: 0.8,
		},
		nutriscore: "a",
		nova: 3,
	},
	{
		ean: "2000000000039",
		name: "Zuppa di legumi e cereali (esempio)",
		brand: "Altra Marca",
		subtype: "legumi",
		quantity: "600 g",
		ingredients:
			"Acqua, ceci, lenticchie, farro, orzo, pomodoro, cipolla, olio extravergine di oliva, sale, rosmarino.",
		nutriments: {
			"energy-kcal_100g": 71,
			fat_100g: 1.5,
			carbohydrates_100g: 10.2,
			sugars_100g: 1.1,
			proteins_100g: 3.4,
			salt_100g: 0.9,
		},
		nutriscore: "a",
		nova: 3,
	},
	{
		ean: "2000000000046",
		name: "Crema di funghi (esempio)",
		brand: "Altra Marca",
		subtype: "vellutata",
		quantity: "500 ml",
		ingredients:
			"Acqua, funghi champignon 20%, panna, amido di mais, cipolla, burro, sale, prezzemolo.",
		nutriments: {
			"energy-kcal_100g": 58,
			fat_100g: 3.9,
			"saturated-fat_100g": 2.3,
			carbohydrates_100g: 4.4,
			sugars_100g: 1.0,
			proteins_100g: 1.1,
			salt_100g: 0.95,
		},
		nutriscore: "c",
		nova: 4,
	},
];

async function main() {
	assertLocalDatabase("The sample products");
	const db = getDb();
	const [category] = await db
		.select()
		.from(categories)
		.where(eq(categories.slug, "zuppe"));
	if (!category) throw new Error("Category 'zuppe' missing: run pnpm db:migrate first");

	for (const example of EXAMPLES) {
		const [product] = await db
			.insert(products)
			.values({
				ean: example.ean,
				categoryId: category.id,
				subtype: example.subtype,
				name: example.name,
				brand: example.brand,
				quantity: example.quantity,
				ingredientsText: example.ingredients,
				status: "published",
			})
			.onConflictDoUpdate({ target: products.ean, set: { updatedAt: sql`now()` } })
			.returning({ id: products.id });
		await db.delete(productSnapshots).where(eq(productSnapshots.productId, product.id));
		await db.insert(productSnapshots).values({
			productId: product.id,
			ingredientsText: example.ingredients,
			allergens:
				example.ingredients.includes("panna") || example.ingredients.includes("burro")
					? ["latte"]
					: example.ingredients.includes("farro")
						? ["glutine"]
						: [],
			nutriments: example.nutriments,
			nutriscore: example.nutriscore,
			nova: example.nova,
		});
	}
	console.log(`Seeded ${EXAMPLES.length} example products`);
	process.exit(0);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
