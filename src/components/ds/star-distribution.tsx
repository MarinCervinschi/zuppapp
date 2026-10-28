import * as m from "motion/react-m";

import { SCORES, type Score } from "@/lib/ranking/rules";

import { StarIcon } from "./stars";

/**
 * How the votes split over the five stars, from five down, as an app store prints it. One
 * series in one ink; the count is always printed, so a bar never carries a number alone.
 */
export function StarDistribution({ counts }: { counts: Record<Score, number> }) {
	const total = SCORES.reduce((sum, score) => sum + counts[score], 0);
	const max = Math.max(1, ...SCORES.map(score => counts[score]));

	return (
		<dl className="flex flex-col gap-2">
			{[...SCORES].reverse().map(score => {
				const count = counts[score];
				const percent = total ? Math.round((count / total) * 100) : 0;
				return (
					<div
						key={score}
						className="grid grid-cols-[2.5rem_1fr_5.5rem] items-center gap-3"
					>
						<dt className="text-body flex items-center gap-1 tabular-nums">
							{score}
							<StarIcon className="size-4" />
							<span className="sr-only">{score === 1 ? "stella" : "stelle"}</span>
						</dt>
						<span
							aria-hidden
							className="bg-text/10 block h-2 overflow-hidden rounded-full"
						>
							{/* Grows to its length as it comes into view, the five rows a beat apart. */}
							<m.span
								className="bg-text block h-full origin-left rounded-full"
								style={{ width: `${(count / max) * 100}%` }}
								initial={{ scaleX: 0 }}
								whileInView={{ scaleX: 1 }}
								viewport={{ once: true }}
								transition={{
									duration: 0.6,
									delay: (5 - score) * 0.06,
									ease: [0.2, 0, 0, 1],
								}}
							/>
						</span>
						<dd className="text-small text-text-soft text-right tabular-nums">
							{count} · {percent}%
						</dd>
					</div>
				);
			})}
		</dl>
	);
}
