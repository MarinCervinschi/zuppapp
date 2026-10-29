import { useEffect, useRef, useState } from "react";

import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { toast } from "sonner";

import { StarPicker } from "@/components/ds/stars";
import { track } from "@/lib/analytics/track";
import type { ProductCard } from "@/lib/catalog/types";
import type { Score } from "@/lib/ranking/rules";
import { SCORE_LABELS } from "@/lib/ranking/rules";
import { useCastVote, useRemoveVote } from "@/lib/voting/mutations";

import { TagPicker } from "./tag-picker";

// Long enough to arrow across the five stars without sending five votes.
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
					onSuccess: ({ firstVote }) => {
						saved.current = { score: nextScore, tagIds: nextTags };
						track("voto", {
							stelle: nextScore,
							nuovo: previous.score === null,
							primo: firstVote,
							tag: nextTags.length,
						});
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

	return { score, tagIds, busy: removeVote.isPending, submit, clear };
}

/** The black panel with the five stars, then, once there is a vote, the tags under it. */
export function VotePanel({
	product,
	vote,
}: {
	product: ProductCard;
	vote: ReturnType<typeof useVote>;
}) {
	const picker = useRef<HTMLDivElement>(null);
	// The star under the mouse, named before it is clicked.
	const [preview, setPreview] = useState<Score | null>(null);

	return (
		<section aria-labelledby="vote-heading" className="flex flex-col gap-6">
			<div className="bg-ink text-on-ink rounded-panel flex flex-col items-center gap-4 px-4 pt-5 pb-4">
				<h2 id="vote-heading" className="font-display text-lead font-medium">
					{vote.score ? "La tua valutazione" : "Com’era?"}
				</h2>
				<StarPicker
					ref={picker}
					value={vote.score}
					onPick={next => vote.submit(next, vote.tagIds)}
					onPreview={setPreview}
				/>
				<div
					className="text-small flex min-h-11 flex-wrap items-center justify-center gap-x-4"
					aria-live="polite"
				>
					{preview && preview !== vote.score ? (
						// For the mouse only: the radio's own name already says it to a screen reader.
						<span aria-hidden className="text-body font-medium">
							«{SCORE_LABELS[preview].label}»
						</span>
					) : vote.score ? (
						<>
							<span>
								«{SCORE_LABELS[vote.score].label}». Per cambiare, tocca un’altra stella.
							</span>
							{/* A real button: the toast that follows can put the vote back. */}
							<button
								type="button"
								disabled={vote.busy}
								onClick={() =>
									vote.clear(() =>
										// The button disappears with the vote: focus goes back to the first star.
										requestAnimationFrame(() =>
											picker.current
												?.querySelector<HTMLElement>('[role="radio"]')
												?.focus()
										)
									)
								}
								className="min-h-11 rounded-full px-2 underline disabled:opacity-50"
							>
								Togli il voto
							</button>
						</>
					) : (
						<span className="text-on-ink/75">
							Una stella: mai più. Cinque: la ricompro.
						</span>
					)}
				</div>
			</div>
			{/* The tags open under the stars with the first vote and fold away when it is taken off. */}
			<AnimatePresence initial={false}>
				{vote.score && (
					<m.div
						key="tags"
						className="overflow-hidden"
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
					>
						<TagPicker
							options={product.tagOptions}
							selected={vote.tagIds}
							onChange={next => vote.submit(vote.score!, next)}
						/>
					</m.div>
				)}
			</AnimatePresence>
		</section>
	);
}
