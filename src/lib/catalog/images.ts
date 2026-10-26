import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";

import type { DbOrTx } from "@/db";
import { products } from "@/db/schema";
import { isR2Configured, putObject } from "@/lib/storage/r2";

/**
 * Copies a product's Open Food Facts photo to R2, named by its content so a new photo gets a
 * new key and the old one stays cached forever. Without R2 it does nothing: the card then
 * shows the Open Food Facts URL kept in the snapshot.
 */
export async function copyProductImage(db: DbOrTx, ean: string, sourceUrl: string) {
	if (!isR2Configured()) return null;

	const response = await fetch(sourceUrl);
	if (!response.ok) throw new Error(`Image ${sourceUrl}: ${response.status}`);
	const body = await response.arrayBuffer();
	const hash = createHash("sha256")
		.update(Buffer.from(body))
		.digest("hex")
		.slice(0, 12);
	const key = `products/${ean}/${hash}.jpg`;

	const [product] = await db
		.select({ imageKey: products.imageKey })
		.from(products)
		.where(eq(products.ean, ean));
	if (product?.imageKey === key) return key;

	await putObject(key, body, response.headers.get("content-type") ?? "image/jpeg");
	await db.update(products).set({ imageKey: key }).where(eq(products.ean, ean));
	return key;
}
