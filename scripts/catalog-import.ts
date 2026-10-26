// Brings soups in from Open Food Facts.
//
//   pnpm catalog:import                  every Italian soup Open Food Facts knows, as drafts
//   pnpm catalog:import --sync           refresh only the products already here (the weekly job)
//   pnpm catalog:import --ean 800…,800…  just these EANs, e.g. a product someone reported
//   --limit 20    stop after 20 products      --dry-run   read and map, write nothing
//   --publish     publish new products at once (local only: in production an admin approves)
import { parseArgs } from "node:util";

import { getDb } from "@/db";
import { products } from "@/db/schema";
import { copyProductImage } from "@/lib/catalog/images";
import { importProduct } from "@/lib/catalog/import";
import { discoverSoupCodes, fetchProduct } from "@/lib/off/client";
import { isStoreInternalCode, mapOffProduct } from "@/lib/off/map";

import { assertLocalDatabase } from "./lib/local-db";

const { values: args } = parseArgs({
	options: {
		sync: { type: "boolean", default: false },
		ean: { type: "string" },
		limit: { type: "string" },
		"dry-run": { type: "boolean", default: false },
		publish: { type: "boolean", default: false },
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

async function main() {
	// In production an admin approves the drafts.
	if (args.publish) assertLocalDatabase("--publish");
	const limit = args.limit ? Number(args.limit) : Infinity;
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
				count("foto non copiata su R2");
				console.warn(`${mapped.product.ean}: ${error.message}`);
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
	process.exit(0);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
