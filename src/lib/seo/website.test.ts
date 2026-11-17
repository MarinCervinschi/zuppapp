import { describe, expect, it } from "vitest";

import { HOME_DESCRIPTION, websiteJsonLd } from "./website";

describe("websiteJsonLd", () => {
	it("names the site and points at the home", () => {
		expect(websiteJsonLd("https://zuppapp.fun")).toMatchObject({
			"@type": "WebSite",
			name: "Zuppapp",
			url: "https://zuppapp.fun/",
		});
	});
});

describe("HOME_DESCRIPTION", () => {
	it("fits in a search result", () => {
		expect(HOME_DESCRIPTION.length).toBeGreaterThan(110);
		expect(HOME_DESCRIPTION.length).toBeLessThanOrEqual(160);
	});
});
