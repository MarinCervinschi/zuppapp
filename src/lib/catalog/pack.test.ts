import { describe, expect, it } from "vitest";

import { packGrams } from "./pack";

describe("packGrams", () => {
	it("reads the ways Open Food Facts writes a weight", () => {
		expect(packGrams("620 g")).toBe(620);
		expect(packGrams("620g")).toBe(620);
		expect(packGrams("620 gr")).toBe(620);
		expect(packGrams("620")).toBe(620);
		expect(packGrams("1 kg")).toBe(1000);
		expect(packGrams("500 ml")).toBe(500);
		expect(packGrams("0,5 l")).toBe(500);
	});

	it("gives up on what is not one pack", () => {
		expect(packGrams("1pcs")).toBeNull();
		expect(packGrams("2 x 300 g")).toBeNull();
		expect(packGrams("5 kg")).toBeNull();
		expect(packGrams(null)).toBeNull();
	});
});
