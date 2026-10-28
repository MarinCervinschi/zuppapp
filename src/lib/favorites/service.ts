import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { favorites, products } from "@/db/schema";
import { NotFound } from "@/lib/server/errors";

/** Puts the heart on a product or takes it off. Doing it twice changes nothing. */
export async function setFavorite(userId: string, productId: string, on: boolean) {
	const db = getDb();
	if (!on) {
		await db
			.delete(favorites)
			.where(and(eq(favorites.userId, userId), eq(favorites.productId, productId)));
		return;
	}
	// A draft is not in the catalogue yet: it cannot be kept.
	const [product] = await db
		.select({ id: products.id })
		.from(products)
		.where(and(eq(products.id, productId), sql`${products.status} <> 'draft'`));
	if (!product) throw new NotFound("Questa zuppa non c’è più.");
	await db.insert(favorites).values({ userId, productId }).onConflictDoNothing();
}

/** The ids of every product the reader keeps, for the hearts on the cards. */
export async function getFavoriteIds(userId: string): Promise<string[]> {
	const rows = await getDb()
		.select({ productId: favorites.productId })
		.from(favorites)
		.where(eq(favorites.userId, userId));
	return rows.map(row => row.productId);
}
