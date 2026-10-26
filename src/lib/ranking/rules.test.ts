import { describe, expect, it } from "vitest";

import { bayesScore, isRanked, isScore, rebuyPercent } from "./rules";

describe("bayesScore", () => {
	it("keeps a single top vote below a well-voted good product", () => {
		const oneVote = bayesScore(4, 1, 2.8);
		const manyVotes = bayesScore(3.8 * 200, 200, 2.8);
		expect(oneVote).toBeLessThan(manyVotes);
	});

	it("is the global mean with no votes", () => {
		expect(bayesScore(0, 0, 2.8)).toBeCloseTo(2.8);
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
