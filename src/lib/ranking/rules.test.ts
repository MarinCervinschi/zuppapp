import { describe, expect, it } from "vitest";

import { bayesRebuyShare, isRanked, isScore, rebuyPercent } from "./rules";

describe("bayesRebuyShare", () => {
	it("keeps a few lucky votes below many good ones", () => {
		const lucky = bayesRebuyShare(5, 7, 0.3); // 71% of 7
		const solid = bayesRebuyShare(30, 40, 0.3); // 75% of 40
		expect(lucky).toBeLessThan(solid);
	});

	it("never reverses two products with the same number of votes", () => {
		expect(bayesRebuyShare(8, 15, 0.3)).toBeLessThan(bayesRebuyShare(10, 15, 0.3));
	});

	it("is the overall share with no votes", () => {
		expect(bayesRebuyShare(0, 0, 0.3)).toBeCloseTo(0.3);
	});
});

describe("rebuyPercent", () => {
	it("rounds the share of top votes", () => {
		expect(rebuyPercent(2, 3)).toBe(67);
	});

	it("is 0 with no votes", () => {
		expect(rebuyPercent(0, 0)).toBe(0);
	});
});

it("ranks from three votes", () => {
	expect(isRanked(2)).toBe(false);
	expect(isRanked(3)).toBe(true);
});

it("accepts only the four faces", () => {
	expect(isScore(4)).toBe(true);
	expect(isScore(0)).toBe(false);
	expect(isScore(5)).toBe(false);
});
