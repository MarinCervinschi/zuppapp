import { describe, expect, it } from "vitest";

import type { ProductCard } from "@/lib/catalog/types";

import { productDescription, productJsonLd, scriptJson } from "./product";

function soup(stats: Partial<ProductCard["stats"]>, extra: Partial<ProductCard> = {}) {
	return {
		ean: "8017596111371",
		name: "Alpine soup",
		brand: "Eat",
		stats: { votesCount: 0, ranked: false, mean: null, ...stats },
		...extra,
	} as ProductCard;
}

const url = "https://zuppapp.fun/prodotti/8017596111371";

describe("productDescription", () => {
	it("gives the mean once the soup is ranked", () => {
		expect(productDescription(soup({ votesCount: 12, ranked: true, mean: 4.5 }))).toBe(
			"Alpine soup di Eat: 4,5 stelle su 5 con 12 voti. Ingredienti, allergeni e valori nutrizionali."
		);
	});

	it("says the votes are too few before the ranking", () => {
		expect(productDescription(soup({ votesCount: 1, mean: 5 }))).toBe(
			"Alpine soup di Eat: 1 voto, ancora pochi per la classifica. Ingredienti, allergeni e valori nutrizionali."
		);
	});

	it("leaves the brand out when there is none", () => {
		expect(productDescription(soup({}, { brand: null }))).toBe(
			"Alpine soup: ancora nessun voto. Ingredienti, allergeni e valori nutrizionali."
		);
	});
});

describe("productJsonLd", () => {
	it("rates a ranked soup", () => {
		const ld = productJsonLd(
			soup({ votesCount: 12, ranked: true, mean: 4.5 }),
			url,
			null
		);
		expect(ld).toMatchObject({
			"@type": "Product",
			gtin13: "8017596111371",
			brand: { name: "Eat" },
			aggregateRating: { ratingValue: 4.5, ratingCount: 12 },
		});
	});

	it("leaves the rating out below the ranking", () => {
		const ld = productJsonLd(soup({ votesCount: 1, mean: 5 }), url, null);
		expect(ld).not.toHaveProperty("aggregateRating");
	});
});

describe("scriptJson", () => {
	it("cannot close the script tag", () => {
		expect(scriptJson({ name: "</script>" })).not.toContain("</");
	});
});
