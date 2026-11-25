import { describe, expect, it } from "vitest";

import { lastChange, sitemapXml } from "./sitemap";

describe("sitemapXml", () => {
	it("lists each address, with its date when it has one", () => {
		const xml = sitemapXml([
			{ loc: "https://zuppapp.fun/" },
			{ loc: "https://zuppapp.fun/prodotti/8017596111371", lastmod: "2026-11-15" },
		]);
		expect(xml).toContain("<url><loc>https://zuppapp.fun/</loc></url>");
		expect(xml).toContain(
			"<url><loc>https://zuppapp.fun/prodotti/8017596111371</loc><lastmod>2026-11-15</lastmod></url>"
		);
	});
});

describe("lastChange", () => {
	const label = new Date("2026-10-26T10:00:00Z");

	it("takes the last vote when it is newer than the label", () => {
		const vote = new Date("2026-11-20T10:00:00Z");
		expect(lastChange(label, vote)).toBe(vote);
	});

	it("keeps the label's date for a soup nobody voted", () => {
		expect(lastChange(label, null)).toBe(label);
	});
});
