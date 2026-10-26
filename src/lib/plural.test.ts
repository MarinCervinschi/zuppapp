import { expect, it } from "vitest";

import { VOTI, ZUPPE, count } from "./plural";

it("uses the Italian plural rules and number format", () => {
	expect(count(1, VOTI)).toBe("1 voto");
	expect(count(0, VOTI)).toBe("0 voti");
	// Italian groups thousands only from five digits: 1234, but 12.345.
	expect(count(1234, ZUPPE)).toBe("1234 zuppe");
	expect(count(12345, ZUPPE)).toBe("12.345 zuppe");
});
