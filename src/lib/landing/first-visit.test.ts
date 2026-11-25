import { describe, expect, it } from "vitest";

import { FIRST_VISIT_SCRIPT, PRESENTED_KEY } from "./first-visit";

/** Runs the head script against a fake browser and says where it sent the visitor. */
function visit({
	path = "/",
	search = "",
	seen = false,
	userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1",
	webdriver = false,
	storage = true,
}: Partial<{
	path: string;
	search: string;
	seen: boolean;
	userAgent: string;
	webdriver: boolean;
	storage: boolean;
}> = {}) {
	const store = new Map<string, string>(seen ? [[PRESENTED_KEY, "1"]] : []);
	const localStorage = {
		getItem: (k: string) => {
			if (!storage) throw new Error("SecurityError");
			return store.get(k) ?? null;
		},
		setItem: (k: string, v: string) => void store.set(k, v),
	};
	let to: string | null = null;
	const location = {
		pathname: path,
		search,
		replace: (url: string) => void (to = url),
	};
	new Function("localStorage", "location", "navigator", FIRST_VISIT_SCRIPT)(
		localStorage,
		location,
		{ userAgent, webdriver }
	);
	return { to, marked: store.has(PRESENTED_KEY) };
}

describe("FIRST_VISIT_SCRIPT", () => {
	it("opens the very first visit to the home on the presentation, once", () => {
		expect(visit()).toEqual({ to: "/presentazione", marked: true });
		expect(visit({ seen: true }).to).toBeNull();
	});

	it("leaves any other first page where it is, and marks the browser all the same", () => {
		expect(visit({ path: "/prodotti/8001120711199" })).toEqual({
			to: null,
			marked: true,
		});
		expect(visit({ search: "?q=lenticchie" }).to).toBeNull();
	});

	it("never moves a crawler, a link preview or a test browser", () => {
		expect(
			visit({ userAgent: "Mozilla/5.0 (compatible; Googlebot/2.1)" }).to
		).toBeNull();
		expect(visit({ userAgent: "WhatsApp/2.24 facebookexternalhit/1.1" }).to).toBeNull();
		expect(visit({ webdriver: true }).to).toBeNull();
	});

	it("does nothing when the browser refuses storage", () => {
		expect(visit({ storage: false }).to).toBeNull();
	});
});
