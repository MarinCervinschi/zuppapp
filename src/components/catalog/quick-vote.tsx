import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { BowlFace } from "@/components/brand/bowl-face";
import {
	MIN_VOTES_TO_RANK,
	SCORES,
	SCORE_LABELS,
	type Score,
} from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";
import { useCastVote } from "@/lib/voting/mutations";

/**
 * Four bowls on a tile: one tap votes without leaving the list. The tags, the receipt and
 * changing your mind live on the product page, one link away.
 */
export function QuickVote({
	productId,
	ean,
	name,
	initial,
	votesCount,
	demo = false,
	onVoted,
}: {
	productId: string;
	ean: string;
	name: string;
	initial: Score | null;
	/** Votes before this reader's, to tell them when theirs is the one that ranks it. */
	votesCount: number;
	/** On the /design page: the bowls respond, nothing is sent. */
	demo?: boolean;
	/** Told the reader's face as soon as they pick it, and again if the save fails. */
	onVoted?: (score: Score | null) => void;
}) {
	const castVote = useCastVote();
	const [score, setScore] = useState<Score | null>(initial);

	function vote(next: Score) {
		const previous = score;
		setScore(next);
		onVoted?.(next);
		if (demo) return;
		castVote.mutate(
			{ productId, score: next },
			{
				onError: () => {
					setScore(previous);
					onVoted?.(previous);
				},
			}
		);
	}

	return (
		<div className="flex flex-col gap-2">
			{/* Four in a row when the tile is wide enough for 48px bowls, two by two when not. */}
			{/*
			 * Four in a row with the two ends of the scale written under them when the tile is wide
			 * enough for 48px bowls; two by two, each bowl with its own word, when it is not.
			 */}
			<div className="@container flex flex-col gap-1">
				<div
					role="group"
					aria-label={`Vota ${name}`}
					className="grid grid-cols-2 gap-2 @[13rem]:grid-cols-4"
				>
					{SCORES.map(face => {
						const chosen = score === face;
						return (
							<button
								key={face}
								type="button"
								aria-pressed={chosen}
								onClick={() => vote(face)}
								className={cn(
									"flex min-h-12 flex-col items-center justify-center gap-1 py-1 transition-[scale,background-color] duration-150 ease-out motion-safe:active:scale-[0.96]",
									chosen ? "bg-text text-ground" : "bg-ground hover:bg-text/10"
								)}
							>
								<BowlFace
									score={face}
									className={cn(
										"text-bowl-ink size-9",
										chosen && "motion-safe:animate-stamp"
									)}
								/>
								{/* The accessible name in every layout; visible only when bowls go two by two. */}
								<span className="text-small leading-tight font-semibold @[13rem]:sr-only">
									{SCORE_LABELS[face].label}
								</span>
							</button>
						);
					})}
				</div>
				<p
					aria-hidden
					className="text-small text-text-soft hidden justify-between @[13rem]:flex"
				>
					<span>Mai più</span>
					<span>La ricompro</span>
				</p>
			</div>
			<p className="text-small min-h-5" aria-live="polite">
				{score && !initial && votesCount + 1 === MIN_VOTES_TO_RANK ? (
					<>
						Con il tuo voto è entrata in classifica.{" "}
						<Link to="/prodotti/$ean" params={{ ean }} className="underline">
							Vedi la scheda<span className="sr-only"> di {name}</span>
						</Link>
					</>
				) : score ? (
					<>
						Hai votato «{SCORE_LABELS[score].label}».{" "}
						<Link to="/prodotti/$ean" params={{ ean }} className="underline">
							Aggiungi due parole<span className="sr-only"> su {name}</span>
						</Link>
					</>
				) : (
					"Assaggiata? Scegli una faccia."
				)}
			</p>
		</div>
	);
}
