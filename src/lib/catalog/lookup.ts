import { and, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { productReports, products } from "@/db/schema";
import { isValidGtin } from "@/lib/barcode/ean13";
import { fetchProduct } from "@/lib/off/client";
import {
	type OffProduct,
	isStoreInternalCode,
	mapOffProduct,
	tidyBrand,
	tidyName,
} from "@/lib/off/map";
import { TooManyRequests, clientIp, hit } from "@/lib/server/rate-limit";
import { isStorageConfigured } from "@/lib/storage/s3";

import { productImageUrl } from "./image";
import { copyProductImage } from "./images";
import { importProduct } from "./import";

// What a scanned or typed code turns out to be. Our catalogue first; for a code we don't know,
// the product API of Open Food Facts, live: a soup there comes in as a draft at once, anything
// else becomes a report the person can send. If Open Food Facts is slow or down, the person
// just gets the report form, and an admin can import the product later from the queue.

const OFF_TIMEOUT_MS = 4000;
// Lookups that reach Open Food Facts, per IP: enough for a shopping trip, not for a crawler.
const OFF_LOOKUPS_PER_HOUR = 30;

export type LookupResult =
	| { kind: "invalid"; ean: string }
	| { kind: "store-code"; ean: string }
	/** Published or archived: the product page shows it. */
	| { kind: "found"; ean: string }
	/** A draft an admin has still to approve; `imported` when this lookup just created it. */
	| {
			kind: "coming";
			ean: string;
			name: string;
			brand: string | null;
			imageUrl: string | null;
			imported: boolean;
	  }
	| {
			kind: "missing";
			ean: string;
			/** What Open Food Facts calls it, to fill the report form; null when it doesn't know it. */
			hint: {
				name: string | null;
				brand: string | null;
				quantity: string | null;
				/** Filed as a soup there, but missing what we need, such as the photo. */
				soup: boolean;
			} | null;
			/** The viewer already sent a report for it that is still open. */
			reported: boolean;
			photos: boolean;
	  };

function hintOf(off: OffProduct | null) {
	if (!off) return null;
	const name = off.product_name_it?.trim() || off.product_name?.trim();
	const brand = (
		Array.isArray(off.brands) ? off.brands[0] : off.brands?.split(",")[0]
	)?.trim();
	return {
		name: name ? tidyName(name) : null,
		brand: brand ? tidyBrand(brand) : null,
		quantity: off.quantity?.trim() || null,
		soup: Boolean(off.categories_tags?.includes("en:soups")),
	};
}

async function readOff(ean: string): Promise<OffProduct | null> {
	try {
		hit(`off:${clientIp()}`, OFF_LOOKUPS_PER_HOUR, 60 * 60 * 1000);
		return await fetchProduct(ean, { timeoutMs: OFF_TIMEOUT_MS, retries: 0 });
	} catch (error) {
		// Too many lookups, a timeout, a 503: the report form is the way on, not an error page.
		if (!(error instanceof TooManyRequests))
			console.warn(`Open Food Facts ${ean}:`, error);
		return null;
	}
}

export async function lookupEan(
	ean: string,
	userId: string | null
): Promise<LookupResult> {
	if (!isValidGtin(ean)) return { kind: "invalid", ean };
	if (isStoreInternalCode(ean)) return { kind: "store-code", ean };

	const db = getDb();
	const [product] = await db
		.select({
			status: products.status,
			name: products.name,
			brand: products.brand,
			imageKey: products.imageKey,
			offImageUrl: sql<string | null>`(
				SELECT image_url FROM product_snapshots s WHERE s.product_id = ${products.id}
				ORDER BY s.fetched_at DESC LIMIT 1
			)`,
		})
		.from(products)
		.where(eq(products.ean, ean));
	if (product && product.status !== "draft") return { kind: "found", ean };
	if (product)
		return {
			kind: "coming",
			ean,
			name: product.name,
			brand: product.brand,
			imageUrl: productImageUrl(product.imageKey) ?? product.offImageUrl,
			imported: false,
		};

	const off = await readOff(ean);
	const mapped = off ? mapOffProduct({ ...off, code: ean }) : null;
	if (off?.categories_tags?.includes("en:soups") && mapped?.ok) {
		await importProduct(db, mapped.product);
		// The photo copy takes a few seconds; the draft shows Open Food Facts' photo meanwhile.
		if (mapped.product.snapshot.imageUrl)
			void copyProductImage(db, ean, mapped.product.snapshot.imageUrl).catch(error =>
				console.warn(`Photo of ${ean}:`, error)
			);
		return {
			kind: "coming",
			ean,
			name: mapped.product.name,
			brand: mapped.product.brand,
			imageUrl: mapped.product.snapshot.imageUrl,
			imported: true,
		};
	}

	const reported = userId
		? (
				await db
					.select({ id: productReports.id })
					.from(productReports)
					.where(
						and(
							eq(productReports.userId, userId),
							eq(productReports.ean, ean),
							eq(productReports.status, "open")
						)
					)
			).length > 0
		: false;

	return {
		kind: "missing",
		ean,
		hint: hintOf(off),
		reported,
		photos: isStorageConfigured(),
	};
}
