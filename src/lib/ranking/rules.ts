// The ranking formula from SPEC.md, kept free of the database so it can be tested alone.

/** Fake votes at the overall share every product starts with, so one top vote cannot win. */
export const PRIOR_VOTES = 5;
/** Below this a product shows "Pochi voti" instead of a rank. */
export const MIN_VOTES_TO_RANK = 3;

export const SCORES = [1, 2, 3, 4] as const;
export type Score = (typeof SCORES)[number];

// The faces themselves are drawn (components/brand/bowl-face.tsx), never emoji.
export const SCORE_LABELS: Record<Score, { label: string }> = {
	1: { label: "Mai più" },
	2: { label: "Si mangia" },
	3: { label: "Buona" },
	4: { label: "La ricompro" },
};

export function isScore(value: number): value is Score {
	return (SCORES as readonly number[]).includes(value);
}

/**
 * What the ranking orders by: the share of "La ricompro" votes, pulled towards the share of
 * all votes by PRIOR_VOTES fake ones. The same formula runs in SQL in catalog/browse.ts.
 */
export function bayesRebuyShare(
	rebuyCount: number,
	votesCount: number,
	globalShare: number
) {
	return (PRIOR_VOTES * globalShare + rebuyCount) / (PRIOR_VOTES + votesCount);
}

/** Share of 🤤 votes, 0–100, rounded: the number the card shows. */
export function rebuyPercent(rebuyCount: number, votesCount: number) {
	if (votesCount === 0) return 0;
	return Math.round((rebuyCount / votesCount) * 100);
}

export function isRanked(votesCount: number) {
	return votesCount >= MIN_VOTES_TO_RANK;
}
