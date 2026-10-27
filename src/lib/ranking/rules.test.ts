import { describe, expect, it } from "vitest";

import { bayesMean, isRanked, isScore, meanStars } from "./rules";

describe("bayesMean", () => {
	it("keeps a few lucky votes below many good ones", () => {
		const lucky = bayesMean(35, 7, 3.5); // 5.0 from 7 votes
		const solid = bayesMean(190, 40, 3.5); // 4.75 from 40 votes
		expect(lucky).toBeLessThan(solid);
	});

	it("never reverses two products with the same number of votes", () => {
		expect(bayesMean(60, 15, 3.5)).toBeLessThan(bayesMean(65, 15, 3.5));
	});

	it("is the overall mean with no votes", () => {
		expect(bayesMean(0, 0, 3.5)).toBeCloseTo(3.5);
	});
});

describe("meanStars", () => {
	it("rounds to one decimal", () => {
		expect(meanStars(14, 3)).toBe(4.7);
	});

	it("is null with no votes", () => {
		expect(meanStars(0, 0)).toBeNull();
	});
});

it("ranks from three votes", () => {
	expect(isRanked(2)).toBe(false);
	expect(isRanked(3)).toBe(true);
});

it("accepts only one to five stars", () => {
	expect(isScore(5)).toBe(true);
	expect(isScore(0)).toBe(false);
	expect(isScore(6)).toBe(false);
});
