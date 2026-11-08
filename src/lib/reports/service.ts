import { and, asc, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";

import { getDb } from "@/db";
import { categories, productReports, products, users } from "@/db/schema";
import { soupNameFor } from "@/lib/auth/names";
import { isValidGtin } from "@/lib/barcode/ean13";
import { productImageUrl, sizedImage } from "@/lib/catalog/image";
import { copyProductImage, copyReportPhoto } from "@/lib/catalog/images";
import { importProduct } from "@/lib/catalog/import";
import { fetchProduct } from "@/lib/off/client";
import { isStoreInternalCode, mapOffProduct, subtypeOf } from "@/lib/off/map";
import {
	Conflict,
	Invalid,
	Unavailable,
	rethrowUniqueViolation,
} from "@/lib/server/errors";
import { log } from "@/lib/server/log";
import { TooManyRequests, hit } from "@/lib/server/rate-limit";
import { deleteObject, isStorageConfigured, putObject } from "@/lib/storage/s3";

import type { ResolveReports } from "../admin/schemas";
import { stripJpegMetadata } from "./photos";
import type { ReportInput, ReportPhoto } from "./schemas";

const REPORTS_PER_HOUR = 10;

async function jpegBytes(file: File) {
	const bytes = stripJpegMetadata(new Uint8Array(await file.arrayBuffer()));
	if (!bytes) throw new Invalid("Le foto devono essere JPEG. Riprova a sceglierle.");
	return bytes.buffer as ArrayBuffer;
}

/**
 * Each photo at `segnalazioni/<random>/<n>.400.jpg` and `.full.jpg`, named like Open Food
 * Facts' so `sizedImage` works on them. The random folder keeps the URL unguessable until an
 * admin decides, and then the photos are deleted.
 */
async function storePhotos(photos: ReportPhoto[]) {
	if (photos.length === 0) return [];
	if (!isStorageConfigured())
		throw new Unavailable("Per ora non possiamo ricevere foto: mandacela senza.");
	const folder = `segnalazioni/${randomUUID()}`;
	const keys: string[] = [];
	for (const [index, photo] of photos.entries()) {
		const [full, small] = await Promise.all([
			jpegBytes(photo.full),
			jpegBytes(photo.small),
		]);
		const key = `${folder}/${index + 1}.400.jpg`;
		await putObject(key, small, "image/jpeg");
		await putObject(sizedImage(key, "full")!, full, "image/jpeg");
		keys.push(key);
	}
	return keys;
}

async function deletePhotos(keys: string[]) {
	await Promise.all(
		keys
			.flatMap(key => [key, sizedImage(key, "full")!])
			.map(key =>
				deleteObject(key).catch(error =>
					log.warn("Report photo {Key} not deleted", { Key: key }, error)
				)
			)
	);
}

/** A signed-in user tells us about a product we don't have. */
export async function submitReport(userId: string, input: ReportInput) {
	if (!isValidGtin(input.ean) || isStoreInternalCode(input.ean))
		throw new Invalid("Questo codice non identifica un prodotto: controlla le cifre.");
	try {
		hit(`report:${userId}`, REPORTS_PER_HOUR, 60 * 60 * 1000);
	} catch (error) {
		if (error instanceof TooManyRequests)
			throw new Invalid("Ci hai mandato tante zuppe di fila: riprova tra un’ora.");
		throw error;
	}

	const db = getDb();
	const [[product], [open]] = await Promise.all([
		db.select({ id: products.id }).from(products).where(eq(products.ean, input.ean)),
		db
			.select({ id: productReports.id })
			.from(productReports)
			.where(
				and(
					eq(productReports.userId, userId),
					eq(productReports.ean, input.ean),
					eq(productReports.status, "open")
				)
			),
	]);
	if (product) throw new Conflict("Questa zuppa ce l’abbiamo già: cercala per nome.");
	if (open) throw new Conflict("Ce l’hai già segnalata: la stiamo guardando.");

	const photoKeys = await storePhotos(input.photos);
	try {
		await db.insert(productReports).values({
			userId,
			ean: input.ean,
			name: input.name,
			brand: input.brand,
			quantity: input.quantity,
			note: input.note,
			photoKeys,
		});
	} catch (error) {
		await deletePhotos(photoKeys);
		rethrowUniqueViolation(error, "Ce l’hai già segnalata: la stiamo guardando.");
	}
	log.info("Report for {Ean} received with {PhotoCount} photos", {
		Ean: input.ean,
		PhotoCount: photoKeys.length,
	});
	return { ean: input.ean };
}

export type ReportView = {
	id: string;
	name: string | null;
	brand: string | null;
	quantity: string | null;
	note: string | null;
	photos: { key: string; thumbUrl: string; fullUrl: string }[];
	author: string;
	createdAt: Date;
};

export type ReportGroup = {
	ean: string;
	/** The product with this EAN, when it is already in the catalogue. */
	product: { name: string; status: "draft" | "published" | "archived" } | null;
	reports: ReportView[];
};

/** The open reports, one group per EAN, the most asked for first. */
export async function listOpenReports(): Promise<ReportGroup[]> {
	const rows = await getDb()
		.select({
			report: productReports,
			nickname: users.nickname,
			productName: products.name,
			productStatus: products.status,
		})
		.from(productReports)
		.innerJoin(users, eq(users.id, productReports.userId))
		.leftJoin(products, eq(products.ean, productReports.ean))
		.where(eq(productReports.status, "open"))
		.orderBy(asc(productReports.createdAt));

	const groups = new Map<string, ReportGroup>();
	for (const row of rows) {
		const { report } = row;
		const group = groups.get(report.ean) ?? {
			ean: report.ean,
			product:
				row.productName && row.productStatus
					? { name: row.productName, status: row.productStatus }
					: null,
			reports: [],
		};
		group.reports.push({
			id: report.id,
			name: report.name,
			brand: report.brand,
			quantity: report.quantity,
			note: report.note,
			photos: report.photoKeys.flatMap(key => {
				const thumbUrl = productImageUrl(key);
				return thumbUrl
					? [{ key, thumbUrl, fullUrl: sizedImage(thumbUrl, "full")! }]
					: [];
			}),
			author: row.nickname ?? soupNameFor(report.userId),
			createdAt: report.createdAt,
		});
		groups.set(report.ean, group);
	}
	return [...groups.values()].sort((a, b) => b.reports.length - a.reports.length);
}

export async function openReportsCount() {
	const [{ count }] = await getDb()
		.select({ count: sql<number>`count(DISTINCT ${productReports.ean})::int` })
		.from(productReports)
		.where(eq(productReports.status, "open"));
	return count;
}

async function createFromReport(input: Extract<ResolveReports, { action: "create" }>) {
	const db = getDb();
	const [category] = await db
		.select({ id: categories.id })
		.from(categories)
		.where(eq(categories.slug, "zuppe"));
	if (!category) throw new Error("Category 'zuppe' missing: run the migrations first");
	try {
		await db.insert(products).values({
			ean: input.ean,
			categoryId: category.id,
			name: input.name,
			brand: input.brand,
			quantity: input.quantity,
			subtype: subtypeOf(input.name),
		});
	} catch (error) {
		rethrowUniqueViolation(
			error,
			"C’è già un prodotto con questo EAN: chiudi le segnalazioni."
		);
	}
	if (input.photoKey) await copyReportPhoto(db, input.ean, input.photoKey);
}

async function importFromOff(ean: string) {
	const off = await fetchProduct(ean, { timeoutMs: 10_000, retries: 1 });
	if (!off)
		throw new Invalid(
			"Open Food Facts non conosce ancora questo prodotto: crea la bozza dalle segnalazioni."
		);
	const mapped = mapOffProduct({ ...off, code: ean });
	if (!mapped.ok)
		throw new Invalid(
			`Open Food Facts lo conosce, ma non si può importare (${mapped.reason}): crea la bozza dalle segnalazioni.`
		);
	await importProduct(getDb(), mapped.product);
	if (mapped.product.snapshot.imageUrl)
		await copyProductImage(getDb(), ean, mapped.product.snapshot.imageUrl).catch(
			error => log.warn("Photo of {Ean} not copied to the bucket", { Ean: ean }, error)
		);
}

/**
 * Settles every open report of one EAN at once, as the admin chose. The product, if any,
 * arrives as a draft; the photos of the reports are deleted, since the product keeps its own copy.
 */
export async function resolveReports(adminId: string, input: ResolveReports) {
	if (input.action === "off") await importFromOff(input.ean);
	if (input.action === "create") await createFromReport(input);

	const open = and(
		eq(productReports.ean, input.ean),
		eq(productReports.status, "open")
	);
	const db = getDb();
	const photoKeys = (
		await db.select({ keys: productReports.photoKeys }).from(productReports).where(open)
	).flatMap(row => row.keys);
	const resolved = await db
		.update(productReports)
		.set({
			status: input.action === "reject" ? "rejected" : "done",
			resolvedBy: adminId,
			resolvedAt: sql`now()`,
			photoKeys: [],
		})
		.where(open)
		.returning({ id: productReports.id });
	await deletePhotos(photoKeys);
	log.info("Reports for {Ean} resolved: {Action}, {Resolved} closed", {
		Ean: input.ean,
		Action: input.action,
		Resolved: resolved.length,
	});
	return { resolved: resolved.length };
}
