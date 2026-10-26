import { expect, it } from "vitest";

import { ean13CheckDigit } from "@/lib/barcode/ean13";
import { isStoreInternalCode } from "@/lib/off/map";

import { loyaltyCode } from "./loyalty";

it("gives each voter a stable, valid, shop-internal EAN-13", () => {
	const code = loyaltyCode("de71e6a1-0329-4f37-b576-33c4783e20f2");
	expect(code).toHaveLength(13);
	expect(code).toBe(loyaltyCode("de71e6a1-0329-4f37-b576-33c4783e20f2"));
	expect(Number(code[12])).toBe(ean13CheckDigit(code.slice(0, 12)));
	expect(isStoreInternalCode(code)).toBe(true);
	expect(loyaltyCode("another-id")).not.toBe(code);
});
