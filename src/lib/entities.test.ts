import { expect, it } from "vitest";

import { decodeEntities } from "./entities";

it("decodes the entities Open Food Facts leaves in its text", () => {
	expect(decodeEntities("farina tipo &quot;O&quot;, sale &amp; pepe")).toBe(
		'farina tipo "O", sale & pepe'
	);
	expect(decodeEntities("&#39;&#x41;")).toBe("'A");
});

it("leaves unknown entities and plain ampersands alone", () => {
	expect(decodeEntities("&foo; e R&D")).toBe("&foo; e R&D");
});
