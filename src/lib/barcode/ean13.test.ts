import { expect, it } from "vitest";

import { barRuns, ean13CheckDigit, ean13Modules } from "./ean13";

it("computes the check digit", () => {
	// 4006381333931 is the textbook example.
	expect(ean13CheckDigit("400638133393")).toBe(1);
});

it("encodes 95 modules with guard bars", () => {
	const modules = ean13Modules("4006381333931")!;
	expect(modules).toHaveLength(95);
	expect(modules.startsWith("101")).toBe(true);
	expect(modules.slice(45, 50)).toBe("01010");
	expect(modules.endsWith("101")).toBe(true);
});

it("refuses anything but 13 digits", () => {
	expect(ean13Modules("12345")).toBeNull();
});

it("groups adjacent bars", () => {
	expect(barRuns("1101001")).toEqual([
		[0, 2],
		[3, 1],
		[6, 1],
	]);
});
