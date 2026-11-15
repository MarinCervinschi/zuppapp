import { describe, expect, it } from "vitest";

import { canonicalRedirect } from "./canonical-host";

const site = "https://zuppapp.fun";

describe("canonicalRedirect", () => {
	it("sends www to the bare name, keeping path and query", () => {
		expect(
			canonicalRedirect("https://www.zuppapp.fun/classifica?tipo=legumi", site)
		).toBe("https://zuppapp.fun/classifica?tipo=legumi");
	});

	it("leaves the app's own address alone", () => {
		expect(canonicalRedirect("https://zuppapp.fun/", site)).toBeNull();
	});

	it("leaves any other host alone, like the health check", () => {
		expect(canonicalRedirect("http://localhost:3000/health", site)).toBeNull();
	});
});
