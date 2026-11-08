// Brings soups in from Open Food Facts.
//
//   pnpm catalog:import                  every Italian soup Open Food Facts knows, as drafts
//   pnpm catalog:import --sync           refresh only the products already here (the weekly job)
//   pnpm catalog:import --ean 800…,800…  just these EANs, e.g. a product someone reported
//   --limit 20    stop after 20 products      --dry-run   read and map, write nothing
//   --publish     publish new products at once (local only: in production an admin approves)
//   pnpm catalog:import --images         copy the photos of products already here to the bucket,
//                                        from their snapshot (with --ean and --limit too)
import { desc, eq } from "drizzle-orm";
import { parseArgs } from "node:util";

import { getDb } from "@/db";
import { productSnapshots, products } from "@/db/schema";
import { copyProductImage } from "@/lib/catalog/images";
import { importProduct } from "@/lib/catalog/import";
import { discoverSoupCodes, fetchProduct } from "@/lib/off/client";
import { isStoreInternalCode, mapOffProduct } from "@/lib/off/map";
import { createLogger, flushLogs } from "@/lib/server/log";
import { isStorageConfigured } from "@/lib/storage/s3";

import { assertLocalDatabase } from "./lib/local-db";

const log = createLogger({ Source: "import" });

const { values: args } = parseArgs({
	options: {
		sync: { type: "boolean", default: false },
		ean: { type: "string" },
		limit: { type: "string" },
		"dry-run": { type: "boolean", default: false },
		publish: { type: "boolean", default: false },
		images: { type: "boolean", default: false },
	},
});

async function* codes(): AsyncGenerator<string> {
	if (args.ean) {
		yield* args.ean.split(",").map(code => code.trim());
	} else if (args.sync) {
		const rows = await getDb().select({ ean: products.ean }).from(products);
		// Products entered by hand under a shop's own code have no Open Food Facts twin.
		for (const row of rows) if (!isStoreInternalCode(row.ean)) yield row.ean;
	} else {
		yield* discoverSoupCodes();
	}
}

/** `--images`: the photos of products already here, from the URL their latest snapshot keeps. */
async function copyImages(limit: number) {
	const only = args.ean ? new Set(args.ean.split(",").map(code => code.trim())) : null;
	const rows = await getDb()
		.selectDistinctOn([products.id], {
			ean: products.ean,
			imageKey: products.imageKey,
			imageUrl: productSnapshots.imageUrl,
		})
		.from(products)
		.innerJoin(productSnapshots, eq(productSnapshots.productId, products.id))
		.orderBy(products.id, desc(productSnapshots.fetchedAt));

	const counts: Record<string, number> = {};
	const count = (key: string) => (counts[key] = (counts[key] ?? 0) + 1);
	let done = 0;
	for (const row of rows) {
		if (done >= limit) break;
		if (only && !only.has(row.ean)) continue;
		if (!row.imageUrl) {
			count("senza foto");
			continue;
		}
		done++;
		const before = row.imageKey;
		await copyProductImage(getDb(), row.ean, row.imageUrl)
			.then(key => count(key === before ? "già copiata" : "copiata"))
			.catch(error => {
				count("non copiata");
				log.warn("Photo of {Ean} not copied to the bucket", { Ean: row.ean }, error);
			});
		if (done % 25 === 0) console.log(`… ${done} foto`);
	}
	for (const [key, value] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		console.log(`  ${String(value).padStart(4)}  ${key}`);
	}
}

async function main() {
	// In production an admin approves the drafts.
	if (args.publish) assertLocalDatabase("--publish");
	const limit = args.limit ? Number(args.limit) : Infinity;
	if (args.images) {
		if (!isStorageConfigured()) throw new Error("--images needs the S3_* variables");
		await copyImages(limit);
		await flushLogs();
		process.exit(0);
	}
	const counts: Record<string, number> = {};
	const count = (key: string) => (counts[key] = (counts[key] ?? 0) + 1);
	const recipeChanges: string[] = [];
	const seen = new Set<string>();

	for await (const code of codes()) {
		if (seen.size >= limit) break;
		if (seen.has(code)) continue;
		seen.add(code);

		const off = await fetchProduct(code);
		if (!off) {
			count("non trovato su Open Food Facts");
			continue;
		}
		const mapped = mapOffProduct(off);
		if (!mapped.ok) {
			count(`scartato: ${mapped.reason}`);
			continue;
		}
		if (args["dry-run"]) {
			count("da importare");
			console.log(
				`${mapped.product.ean}  ${mapped.product.subtype ?? "—"}  ${mapped.product.name} · ${mapped.product.brand ?? ""}`
			);
			continue;
		}
		const { outcome, recipeChanged } = await importProduct(getDb(), mapped.product, {
			publish: args.publish,
		});
		count(outcome);
		if (outcome !== "unchanged" && mapped.product.snapshot.imageUrl) {
			await copyProductImage(
				getDb(),
				mapped.product.ean,
				mapped.product.snapshot.imageUrl
			).catch(error => {
				count("foto non copiata nel bucket");
				log.warn(
					"Photo of {Ean} not copied to the bucket",
					{ Ean: mapped.product.ean },
					error
				);
			});
		}
		if (recipeChanged)
			recipeChanges.push(`${mapped.product.ean} ${mapped.product.name}`);
		if (seen.size % 25 === 0) console.log(`… ${seen.size} prodotti letti`);
	}

	console.log(`\n${seen.size} prodotti letti`);
	for (const [key, value] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
		console.log(`  ${String(value).padStart(4)}  ${key}`);
	}
	if (recipeChanges.length > 0) {
		console.log(`\nRicetta cambiata:\n  ${recipeChanges.join("\n  ")}`);
	}
	log.info("Import finished: {Read} products read, {RecipeChanges} recipes changed", {
		Read: seen.size,
		RecipeChanges: recipeChanges.length,
		Mode: args.sync ? "sync" : args.ean ? "ean" : "discover",
		DryRun: args["dry-run"],
		Outcomes: counts,
	});
	await flushLogs();
	process.exit(0);
}

main().catch(async error => {
	log.error("Import failed", {}, error);
	await flushLogs();
	process.exit(1);
});
