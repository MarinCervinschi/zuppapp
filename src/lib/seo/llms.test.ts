import { describe, expect, it } from "vitest";

import type { ProductListItem } from "@/lib/catalog/types";

import { llmsTxt } from "./llms";

const soup: ProductListItem = {
	id: "1",
	ean: "8001234567890",
	name: "Zuppa [toscana]",
	brand: "Marca",
	subtype: null,
	quantity: null,
	imageUrl: null,
	votesCount: 12,
	mean: 4.25,
	scoreCounts: { 1: 0, 2: 0, 3: 1, 4: 7, 5: 4 },
	rank: 1,
	myScore: null,
};

describe("llmsTxt", () => {
	const text = llmsTxt("https://zuppapp.fun", { soups: 483, ranked: 40, top: [soup] });

	it("opens with the title and the summary", () => {
		expect(text.startsWith("# Zuppapp\n\n> ")).toBe(true);
	});

	it("links each soup of the top with its mean and votes", () => {
		expect(text).toContain(
			"1. [Zuppa \\[toscana\\] (Marca)](https://zuppapp.fun/prodotti/8001234567890): 4,3 stelle su 5, 12 voti"
		);
	});

	it("leaves the top out while nothing is ranked", () => {
		const empty = llmsTxt("https://zuppapp.fun", { soups: 483, ranked: 0, top: [] });
		expect(empty).not.toContain("della classifica\n");
	});
});
