import { forwardRef } from "react";

import { BowlFace } from "@/components/brand/bowl-face";
import { SCORES, SCORE_LABELS, type Score } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

type Props = {
	value: Score | null;
	onPick: (score: Score) => void;
};

/**
 * Four bowls, one tap. A real radio group: arrow keys move between faces and each one's
 * accessible name is its words, never the drawing. It is never disabled while a vote is
 * saving, so focus stays where the keyboard put it; the vote itself is debounced upstream.
 */
export const FacePicker = forwardRef<HTMLDivElement, Props>(function FacePicker(
	{ value, onPick },
	ref
) {
	return (
		// Four across, or two by two when large text leaves less than ~19rem.
		<div className="@container">
			<div
				ref={ref}
				role="radiogroup"
				aria-label="Il tuo voto"
				className="grid grid-cols-2 gap-2 @[19rem]:grid-cols-4"
			>
				{SCORES.map(score => {
					const selected = value === score;
					return (
						<button
							key={score}
							type="button"
							role="radio"
							aria-checked={selected}
							tabIndex={selected || (value === null && score === 1) ? 0 : -1}
							onClick={() => onPick(score)}
							onKeyDown={event => {
								const step = {
									ArrowRight: 1,
									ArrowDown: 1,
									ArrowLeft: -1,
									ArrowUp: -1,
								}[event.key];
								if (!step) return;
								event.preventDefault();
								const index =
									(SCORES.indexOf(score) + step + SCORES.length) % SCORES.length;
								onPick(SCORES[index]);
								(
									event.currentTarget.parentElement?.children[index] as
										HTMLElement | undefined
								)?.focus();
							}}
							className={cn(
								"flex min-h-28 flex-col items-center justify-center gap-2 px-1 pt-3 pb-2",
								"transition-[scale,background-color] duration-150 ease-out motion-safe:active:scale-[0.96]",
								selected ? "bg-text text-ground" : "bg-ground-raised hover:bg-text/10"
							)}
						>
							<BowlFace
								score={score}
								className={cn(
									"text-bowl-ink size-14 transition-[scale] duration-150 ease-out",
									selected && "motion-safe:scale-110"
								)}
							/>
							<span className="font-semicondensed text-small text-center leading-tight font-bold">
								{SCORE_LABELS[score].label}
							</span>
						</button>
					);
				})}
			</div>
		</div>
	);
});
