import { describe, expect, it } from "vitest";

import { sitemapXml } from "./sitemap";

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
