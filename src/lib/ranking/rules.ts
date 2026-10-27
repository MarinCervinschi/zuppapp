// The ranking formula from SPEC.md, kept free of the database so it can be tested alone.

/** Fake votes at the overall mean every product starts with, so one top vote cannot win. */
export const PRIOR_VOTES = 5;
/** Below this a product shows "Pochi voti" instead of a rank. */
export const MIN_VOTES_TO_RANK = 3;

export const SCORES = [1, 2, 3, 4, 5] as const;
export type Score = (typeof SCORES)[number];

// Each star has a name, read by screen readers and shown under the stars once chosen.
export const SCORE_LABELS: Record<Score, { label: string }> = {
	1: { label: "Mai più" },
	2: { label: "Si mangia" },
	3: { label: "Niente male" },
	4: { label: "Buona" },
	5: { label: "La ricompro" },
};

export function isScore(value: number): value is Score {
	return (SCORES as readonly number[]).includes(value);
}

/**
 * What the ranking orders by: the mean of the stars, pulled towards the mean of all votes by
 * PRIOR_VOTES fake ones. The same formula runs in SQL in catalog/browse.ts.
 */
export function bayesMean(scoreSum: number, votesCount: number, globalMean: number) {
	return (PRIOR_VOTES * globalMean + scoreSum) / (PRIOR_VOTES + votesCount);
}

/** The plain mean of the stars, to one decimal: the number the badge shows. Null with no votes. */
export function meanStars(scoreSum: number, votesCount: number) {
	if (votesCount === 0) return null;
	return Math.round((scoreSum / votesCount) * 10) / 10;
}

export function isRanked(votesCount: number) {
	return votesCount >= MIN_VOTES_TO_RANK;
}
