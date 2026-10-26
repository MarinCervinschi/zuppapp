import { describe, expect, it } from "vitest";

import {
	isStoreInternalCode,
	mapOffProduct,
	sameRecipe,
	subtypeOf,
	tidyBrand,
	tidyName,
} from "./map";

const NOW = new Date("2026-10-26T00:00:00Z");

const base = {
	code: "8001120828774",
	product_name_it: "Minestrone di verdure surgelato",
	brands: "Coop, Coop Italia",
	quantity: "450 g",
	categories_tags: ["en:soups", "en:frozen-foods"],
	image_front_url: "https://images.openfoodfacts.org/x.jpg",
	ingredients_text_it: "Ortaggi  misti (patate, carote)",
	allergens_tags: ["en:celery"],
	nutriments: {
		"energy-kcal_100g": 56,
		salt_100g: 0.08,
		"energy-kj_100g": 234,
		fat_100g: "n/a",
	},
	nutriscore_grade: "a",
	nova_group: 3,
	last_modified_t: Date.parse("2026-03-30T00:00:00Z") / 1000,
};

describe("mapOffProduct", () => {
	it("maps an Italian soup", () => {
		const result = mapOffProduct(base, NOW);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.product).toMatchObject({
			ean: "8001120828774",
			name: "Minestrone di verdure surgelato",
			brand: "Coop",
			subtype: "minestrone",
			attributes: { format: "surgelato" },
			ingredientsText: "Ortaggi misti (patate, carote)",
		});
		expect(result.product.snapshot.nutriments).toEqual({
			"energy-kcal_100g": 56,
			salt_100g: 0.08,
		});
		expect(result.product.snapshot.allergens).toEqual(["sedano"]);
	});

	it("skips what cannot be shown or is stale", () => {
		expect(mapOffProduct({ ...base, image_front_url: undefined }, NOW)).toEqual({
			ok: false,
			reason: "senza foto",
		});
		expect(
			mapOffProduct({ ...base, product_name_it: " ", product_name: undefined }, NOW).ok
		).toBe(false);
		expect(mapOffProduct({ ...base, code: "abc" }, NOW).ok).toBe(false);
		expect(
			mapOffProduct({ ...base, last_modified_t: Date.parse("2020-01-01") / 1000 }, NOW)
		).toEqual({ ok: false, reason: "fermo da oltre 5 anni" });
	});

	it("accepts brands as a list", () => {
		const result = mapOffProduct({ ...base, brands: ["Esselunga"] }, NOW);
		expect(result.ok && result.product.brand).toBe("Esselunga");
	});
});

describe("subtypeOf", () => {
	it.each([
		["Vellutata di zucca", "vellutata"],
		["Crema di funghi porcini", "vellutata"],
		["Passato di verdure", "passato"],
		["Zuppa di fagioli borlotti", "legumi"],
		["Zuppa di farro", "cereali"],
		["Brodo vegetale", "brodo"],
		["Mix di cereali al profumo di curry", "cereali"],
		["Crema con zucca e carote", "vellutata"],
		["Ribollita toscana", null],
	])("%s → %s", (name, subtype) => {
		expect(subtypeOf(name)).toBe(subtype);
	});
});

it("treats spacing and punctuation changes as the same recipe", () => {
	expect(sameRecipe("Acqua, ceci (30%).", "acqua ceci 30%")).toBe(true);
	expect(sameRecipe("Acqua, ceci 30%", "Acqua, ceci 25%")).toBe(false);
});

it("tidies shouted and lowercase names", () => {
	expect(tidyName("MINESTRONE DI VERDURE DI ESTIVO")).toBe(
		"Minestrone di verdure di estivo"
	);
	expect(tidyName("mix di cereali al profumo di Curry")).toBe(
		"Mix di cereali al profumo di Curry"
	);
	expect(tidyName("Zuppa Toscana")).toBe("Zuppa Toscana");
});

it("folds brand spellings together", () => {
	expect(tidyBrand("CONAD")).toBe("Conad");
	expect(tidyBrand("F.I.R.M.A. ITALIA")).toBe("F.I.R.M.A. Italia");
	expect(tidyBrand("MD")).toBe("MD");
	expect(tidyBrand("il viaggiator goloso")).toBe("Il viaggiator goloso");
	expect(tidyBrand("Pam & Panorama")).toBe("Pam & Panorama");
});

it("refuses shops' internal codes, which name different products in different chains", () => {
	expect(isStoreInternalCode("2000000000015")).toBe(true);
	expect(isStoreInternalCode("0212345678901")).toBe(true);
	expect(isStoreInternalCode("8001120828774")).toBe(false);
	expect(isStoreInternalCode("20123456")).toBe(true);
	expect(mapOffProduct({ ...base, code: "2000000000015" }, NOW)).toEqual({
		ok: false,
		reason: "codice interno del negozio",
	});
});
