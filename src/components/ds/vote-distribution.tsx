import { BowlFace } from "@/components/brand/bowl-face";
import { SCORES, SCORE_LABELS, type Score } from "@/lib/ranking/rules";

import { ReceiptRow } from "./receipt";

/**
 * How the votes split over the four faces, as receipt rows. One series, so one ink; only
 * "La ricompro", the figure the label shows, is stamped red. Counts are always printed,
 * so the bars are never the only carrier of the numbers.
 */
export function VoteDistribution({ counts }: { counts: Record<Score, number> }) {
	const total = SCORES.reduce((sum, score) => sum + counts[score], 0);
	const max = Math.max(1, ...SCORES.map(score => counts[score]));

	return (
		<>
			{[...SCORES].reverse().map((score, index) => {
				const count = counts[score];
				const percent = total ? Math.round((count / total) * 100) : 0;
				return (
					// Printed one line after the other, once, when the receipt first appears.
					<div
						key={score}
						className="animate-print"
						style={{ animationDelay: `${index * 100}ms` }}
					>
						<ReceiptRow
							label={
								<span className="flex items-center gap-2">
									<BowlFace score={score} className="size-7" />
									{SCORE_LABELS[score].label}
								</span>
							}
							value={`${count} · ${percent}%`}
							emphasis={score === 4}
						>
							<span aria-hidden className="bg-text/10 ml-9 block h-1.5">
								<span
									className={
										score === 4 ? "bg-accent block h-full" : "bg-text block h-full"
									}
									style={{ width: `${(count / max) * 100}%` }}
								/>
							</span>
						</ReceiptRow>
					</div>
				);
			})}
		</>
	);
}
