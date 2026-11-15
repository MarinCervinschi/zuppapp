import type { DbOrTx } from "@/db";
import { fetchProduct } from "@/lib/off/client";
import { mapOffProduct } from "@/lib/off/map";
import { log } from "@/lib/server/log";

import { copyProductImage } from "./images";
import { type ImportOutcome, importProduct } from "./import";

export type OffImport =
	| { ok: true; outcome: ImportOutcome }
	| { ok: false; reason: "unknown" }
	| { ok: false; reason: "unusable"; detail: string };

/**
 * Reads one EAN from Open Food Facts now and writes it like the import script does: a new
 * product as a draft, a known one refreshed with its hand corrections kept, then its photo. An
 * admin chose the product, so one without a photo or not edited for years comes in too.
 */
export async function importFromOff(db: DbOrTx, ean: string): Promise<OffImport> {
	const off = await fetchProduct(ean, { timeoutMs: 10_000, retries: 1 });
	if (!off) return { ok: false, reason: "unknown" };
	const mapped = mapOffProduct({ ...off, code: ean }, new Date(), { chosen: true });
	if (!mapped.ok) return { ok: false, reason: "unusable", detail: mapped.reason };
	const { outcome } = await importProduct(db, mapped.product);
	if (mapped.product.snapshot.imageUrl)
		await copyProductImage(db, ean, mapped.product.snapshot.imageUrl).catch(error =>
			log.warn("Photo of {Ean} not copied to the bucket", { Ean: ean }, error)
		);
	return { ok: true, outcome };
}
