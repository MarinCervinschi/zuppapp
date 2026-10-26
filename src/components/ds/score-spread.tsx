import { BowlFace } from "@/components/brand/bowl-face";
import { SCORES, SCORE_LABELS, type Score } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

// One ordinal series: "La ricompro", the figure every label prints, is stamped red, "Buona"
// is full ink, the two low faces share a lighter ink that still holds 3:1 on paper, and
// "Mai più" is hatched so it never depends on telling two greys apart. Segments are split
// by 2px of paper, never by a line.
const SEGMENT: Record<Score, string> = {
	4: "bg-accent",
	3: "bg-text",
	2: "bg-text/55",
	1: "hatch text-text/70",
};

function describe(counts: Record<Score, number>) {
	const total = SCORES.reduce((sum, score) => sum + counts[score], 0);
	return [...SCORES]
		.reverse()
		.map(
			score =>
				`${SCORE_LABELS[score].label} ${total ? Math.round((counts[score] / total) * 100) : 0}%`
		)
		.join(", ");
}

/** How the votes split, best face first, as one bar. Its words are its accessible name. */
export function ScoreSpread({
	counts,
	className,
}: {
	counts: Record<Score, number>;
	className?: string;
}) {
	const total = SCORES.reduce((sum, score) => sum + counts[score], 0);
	if (total === 0) return null;
	return (
		<span
			role="img"
			aria-label={describe(counts)}
			className={cn("flex h-2 w-full gap-0.5", className)}
		>
			{[...SCORES]
				.reverse()
				.map(score =>
					counts[score] > 0 ? (
						<span
							key={score}
							className={SEGMENT[score]}
							style={{ flexGrow: counts[score], flexBasis: 0 }}
						/>
					) : null
				)}
		</span>
	);
}

/** The key to the bar, printed once above a list of bars. */
export function SpreadLegend() {
	return (
		<ul
			className="text-small flex flex-wrap gap-x-4 gap-y-2"
			aria-label="Come leggere le barre"
		>
			{[...SCORES].reverse().map(score => (
				<li key={score} className="flex items-center gap-1.5">
					<span aria-hidden className={cn("block h-2 w-4", SEGMENT[score])} />
					<BowlFace score={score} className="text-bowl-ink size-5" />
					{SCORE_LABELS[score].label}
				</li>
			))}
		</ul>
	);
}
