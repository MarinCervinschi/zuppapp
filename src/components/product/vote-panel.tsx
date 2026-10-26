import { useEffect, useRef, useState } from "react";

import { toast } from "sonner";

import { Button } from "@/components/ds/button";
import type { ProductCard } from "@/lib/catalog/types";
import type { Score } from "@/lib/ranking/rules";
import { useCastVote, useRemoveVote } from "@/lib/voting/mutations";

import { FacePicker } from "./face-picker";
import { TagPicker } from "./tag-picker";

// Long enough to arrow across the four faces without sending four votes.
const SAVE_DELAY_MS = 600;

/**
 * The reader's vote: shown at once, saved a moment later. Moving between faces with the
 * arrow keys or changing tags quickly sends one vote, not one per press.
 */
export function useVote(product: ProductCard) {
	const castVote = useCastVote(product.ean);
	const removeVote = useRemoveVote(product.ean);

	const [score, setScore] = useState<Score | null>(product.myVote?.score ?? null);
	const [tagIds, setTagIds] = useState<string[]>(product.myVote?.tagIds ?? []);
	// Counts saved changes of face, so the stamp is pressed on each one but not on page load.
	const [stampKey, setStampKey] = useState(0);
	const saved = useRef({ score, tagIds });
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => () => clearTimeout(timer.current), []);

	function submit(nextScore: Score, nextTags: string[]) {
		setScore(nextScore);
		setTagIds(nextTags);
		clearTimeout(timer.current);
		timer.current = setTimeout(() => {
			const previous = saved.current;
			castVote.mutate(
				{ productId: product.id, score: nextScore, tagIds: nextTags },
				{
					onSuccess: () => {
						if (nextScore !== previous.score) setStampKey(key => key + 1);
						saved.current = { score: nextScore, tagIds: nextTags };
					},
					onError: () => {
						setScore(previous.score);
						setTagIds(previous.tagIds);
					},
				}
			);
		}, SAVE_DELAY_MS);
	}

	/** Removes the vote, with a way to put it back: removing it also drops its tags. */
	function clear(onCleared?: () => void) {
		clearTimeout(timer.current);
		const previous = { score, tagIds };
		removeVote.mutate(product.id, {
			onSuccess: () => {
				saved.current = { score: null, tagIds: [] };
				setScore(null);
				setTagIds([]);
				onCleared?.();
				if (previous.score) {
					const restore = previous.score;
					toast("Voto tolto", {
						action: {
							label: "Rimettilo",
							onClick: () => submit(restore, previous.tagIds),
						},
					});
				}
			},
		});
	}

	return { score, tagIds, busy: removeVote.isPending, stampKey, submit, clear };
}

export function VotePanel({
	product,
	vote,
}: {
	product: ProductCard;
	vote: ReturnType<typeof useVote>;
}) {
	const picker = useRef<HTMLDivElement>(null);

	return (
		<section aria-labelledby="vote-heading" className="flex flex-col gap-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<h2
					id="vote-heading"
					className="font-condensed text-lead font-extrabold uppercase"
				>
					{vote.score ? "Il tuo voto" : "Com’era?"}
				</h2>
				{vote.score && (
					// A real button, beside the heading it undoes; the toast that follows can put it back.
					<Button
						disabled={vote.busy}
						onClick={() =>
							vote.clear(() =>
								// The button disappears with the vote: focus goes back to the first face.
								requestAnimationFrame(() =>
									picker.current?.querySelector<HTMLElement>('[role="radio"]')?.focus()
								)
							)
						}
						className="min-h-11 px-4"
					>
						<svg aria-hidden viewBox="0 0 12 12" className="size-3">
							<path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="2" />
						</svg>
						Togli il voto
					</Button>
				)}
			</div>
			<FacePicker
				ref={picker}
				value={vote.score}
				onPick={next => vote.submit(next, vote.tagIds)}
			/>
			{vote.score && (
				<>
					<p className="text-small text-text-soft -mt-3">
						Hai cambiato idea? Tocca un’altra faccia.
					</p>
					<TagPicker
						options={product.tagOptions}
						selected={vote.tagIds}
						onChange={next => vote.submit(vote.score!, next)}
					/>
				</>
			)}
		</section>
	);
}
