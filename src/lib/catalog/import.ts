import { desc, eq, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db";
import { categories, productSnapshots, products } from "@/db/schema";
import { type MappedProduct, sameRecipe } from "@/lib/off/map";

export type ImportOutcome = "created" | "updated" | "unchanged";

// The product columns Open Food Facts owns. An admin correction of any of them is kept in
// `products.overrides` under the same key, and wins over every later sync.
const SYNCED = [
	"name",
	"brand",
	"quantity",
	"subtype",
	"ingredientsText",
	"attributes",
] as const;
type Synced = Pick<MappedProduct, (typeof SYNCED)[number]>;

function withOverrides(fresh: Synced, overrides: Record<string, unknown>): Synced {
	const result = { ...fresh } as Record<string, unknown>;
	for (const key of SYNCED) if (key in overrides) result[key] = overrides[key];
	return result as Synced;
}

function sameSnapshot(
	a: MappedProduct["snapshot"],
	b: typeof productSnapshots.$inferSelect | undefined
) {
	if (!b) return false;
	return (
		(a.ingredientsText ?? null) === (b.ingredientsText ?? null) &&
		JSON.stringify(a.allergens) === JSON.stringify(b.allergens ?? []) &&
		JSON.stringify(a.nutriments) === JSON.stringify(b.nutriments ?? {}) &&
		a.nutriscore === b.nutriscore &&
		a.nova === b.nova &&
		a.imageUrl === b.imageUrl
	);
}

/**
 * Writes one Open Food Facts product. New products arrive as drafts for an admin to
 * approve; known ones are refreshed, keeping hand corrections. A snapshot is stored only
 * when the label changed, and a changed ingredient list marks the recipe as changed.
 */
export async function importProduct(
	db: DbOrTx,
	mapped: MappedProduct,
	options: { publish?: boolean; now?: Date } = {}
): Promise<{ outcome: ImportOutcome; recipeChanged: boolean }> {
	const now = options.now ?? new Date();

	return db.transaction(async tx => {
		const [existing] = await tx
			.select()
			.from(products)
			.where(eq(products.ean, mapped.ean));

		if (!existing) {
			const [category] = await tx
				.select({ id: categories.id })
				.from(categories)
				.where(eq(categories.slug, "zuppe"));
			if (!category)
				throw new Error("Category 'zuppe' missing: run the migrations first");

			const [created] = await tx
				.insert(products)
				.values({
					ean: mapped.ean,
					categoryId: category.id,
					...withOverrides(mapped, {}),
					nutriscore: mapped.snapshot.nutriscore,
					allergens: mapped.snapshot.allergens,
					status: options.publish ? "published" : "draft",
					offLastModifiedAt: mapped.offLastModifiedAt,
				})
				.returning({ id: products.id });
			await tx
				.insert(productSnapshots)
				.values({ productId: created.id, ...mapped.snapshot });
			return { outcome: "created" as const, recipeChanged: false };
		}

		const [latest] = await tx
			.select()
			.from(productSnapshots)
			.where(eq(productSnapshots.productId, existing.id))
			.orderBy(desc(productSnapshots.fetchedAt))
			.limit(1);

		const labelChanged = !sameSnapshot(mapped.snapshot, latest);
		const recipeChanged =
			labelChanged &&
			latest?.ingredientsText != null &&
			mapped.snapshot.ingredientsText != null &&
			!sameRecipe(latest.ingredientsText, mapped.snapshot.ingredientsText);

		if (labelChanged) {
			await tx
				.insert(productSnapshots)
				.values({ productId: existing.id, ...mapped.snapshot, fetchedAt: now });
		}
		await tx
			.update(products)
			.set({
				...withOverrides(mapped, existing.overrides),
				nutriscore: mapped.snapshot.nutriscore,
				allergens: mapped.snapshot.allergens,
				offLastModifiedAt: mapped.offLastModifiedAt,
				...(recipeChanged ? { recipeChangedAt: now } : {}),
				updatedAt: sql`now()`,
			})
			.where(eq(products.id, existing.id));

		return { outcome: labelChanged ? "updated" : "unchanged", recipeChanged };
	});
}
