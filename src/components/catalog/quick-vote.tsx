import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { StarPicker } from "@/components/ds/stars";
import { MIN_VOTES_TO_RANK, SCORE_LABELS, type Score } from "@/lib/ranking/rules";
import { useCastVote } from "@/lib/voting/mutations";

/**
 * Five stars on a card, on the same black panel as the product page: one tap votes without
 * leaving the list. The tags and changing your mind live on the product page, one link away.
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
	/** On the /design page: the stars respond, nothing is sent. */
	demo?: boolean;
	/** Told the reader's stars as soon as they pick them, and again if the save fails. */
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
			<div className="bg-ink text-on-ink rounded-full px-1.5">
				<StarPicker value={score} onPick={vote} label={`Vota ${name}`} size="sm" />
			</div>
			<p className="text-small min-h-5 px-1" aria-live="polite">
				{score && !initial && votesCount + 1 === MIN_VOTES_TO_RANK ? (
					<>
						Con il tuo voto è entrata in classifica.{" "}
						<Link to="/prodotti/$ean" params={{ ean }} className="underline">
							Vedi la scheda<span className="sr-only"> di {name}</span>
						</Link>
					</>
				) : score ? (
					<>
						«{SCORE_LABELS[score].label}».{" "}
						<Link to="/prodotti/$ean" params={{ ean }} className="underline">
							Aggiungi due parole<span className="sr-only"> su {name}</span>
						</Link>
					</>
				) : (
					<span className="text-text-soft">Assaggiata? Tocca le stelle.</span>
				)}
			</p>
		</div>
	);
}
