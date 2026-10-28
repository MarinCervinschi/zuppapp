import { eq } from "drizzle-orm";
import { createHash } from "node:crypto";

import type { DbOrTx } from "@/db";
import { products } from "@/db/schema";
import { getObject, isStorageConfigured, putObject } from "@/lib/storage/s3";

import { sizedImage } from "./image";

const SIZES = [100, 200, 400, "full"] as const;

type Photo = { body: ArrayBuffer; contentType: string };

async function download(url: string): Promise<Photo> {
	const response = await fetch(url);
	if (!response.ok) throw new Error(`Image ${url}: ${response.status}`);
	return {
		body: await response.arrayBuffer(),
		contentType: response.headers.get("content-type") ?? "image/jpeg",
	};
}

/**
 * Copies a product's Open Food Facts photo to our bucket in the four sizes Open Food Facts
 * serves, named like theirs (`<hash>.400.jpg`), so `sizedImage` picks a size on either URL.
 * The hash is the 400 px photo's, so a new photo gets new keys and the old ones stay cached
 * forever. Without storage it does nothing: the card then shows the snapshot's URL.
 */
export async function copyProductImage(db: DbOrTx, ean: string, sourceUrl: string) {
	if (!isStorageConfigured()) return null;
	return storeProductImage(db, ean, size =>
		download(sizedImage(sourceUrl, size) ?? sourceUrl)
	);
}

/**
 * The photo of a report, as the product's: the browser sent it at 400 px and at full size,
 * and the 400 one stands in for 100 and 200 too.
 */
export async function copyReportPhoto(db: DbOrTx, ean: string, photoKey: string) {
	if (!isStorageConfigured()) return null;
	return storeProductImage(db, ean, async size => ({
		body: await getObject(
			size === "full" ? (sizedImage(photoKey, "full") ?? photoKey) : photoKey
		),
		contentType: "image/jpeg",
	}));
}

async function storeProductImage(
	db: DbOrTx,
	ean: string,
	read: (size: (typeof SIZES)[number]) => Promise<Photo>
) {
	const medium = await read(400);
	const hash = createHash("sha256")
		.update(Buffer.from(medium.body))
		.digest("hex")
		.slice(0, 12);
	const keyFor = (size: (typeof SIZES)[number]) =>
		`products/${ean}/${hash}.${size}.jpg`;
	const key = keyFor(400);

	const [product] = await db
		.select({ imageKey: products.imageKey })
		.from(products)
		.where(eq(products.ean, ean));
	if (product?.imageKey === key) return key;

	for (const size of SIZES) {
		const image = size === 400 ? medium : await read(size);
		await putObject(keyFor(size), image.body, image.contentType);
	}
	await db.update(products).set({ imageKey: key }).where(eq(products.ean, ean));
	return key;
}
