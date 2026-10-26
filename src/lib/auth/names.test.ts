import { expect, it } from "vitest";

import { soupNameFor } from "./names";

it("gives an id the same soup name every time", () => {
	const id = "de71e6a1-0329-4f37-b576-33c4783e20f2";
	expect(soupNameFor(id)).toBe(soupNameFor(id));
	expect(soupNameFor(id)).toMatch(/^.+ Anonimo #\d{4}$/);
});
