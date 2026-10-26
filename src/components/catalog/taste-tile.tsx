import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { subtypeLabel } from "@/lib/catalog/labels";
import type { ProductListItem } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";
import { MIN_VOTES_TO_RANK, type Score } from "@/lib/ranking/rules";

import { QuickVote } from "./quick-vote";

/**
 * A product still to taste: its pack first, because that is how people find it on the shelf,
 * then how far it is from the ranking, then the four bowls to vote it there.
 */
export function TasteTile({
	product,
	demo,
}: {
	product: ProductListItem;
	demo?: boolean;
}) {
	// The reader's own vote counts at once, so the badge never says "Nessun voto" under "Hai votato".
	const [myScore, setMyScore] = useState<Score | null>(product.myScore);
	const votes = product.votesCount + (myScore && !product.myScore ? 1 : 0);
	const missing = MIN_VOTES_TO_RANK - votes;
	const details = [
		product.brand,
		product.subtype && subtypeLabel(product.subtype).toLowerCase(),
		product.quantity,
	]
		.filter(Boolean)
		.join(" · ");

	return (
		<article className="bg-ground-raised flex h-full flex-col gap-3 p-3">
			<div className="flex aspect-square items-center justify-center bg-white p-3">
				{product.imageUrl ? (
					<ZoomablePhoto
						src={product.imageUrl}
						name={product.name}
						size="shelf"
						className="flex max-h-full items-center justify-center"
						imageClassName="max-h-full outline-none"
					/>
				) : (
					<span className="font-condensed text-lead font-black text-black/60 uppercase">
						Senza foto
					</span>
				)}
			</div>
			<div className="flex flex-col gap-1">
				<Link
					to="/prodotti/$ean"
					params={{ ean: product.ean }}
					className="font-semicondensed text-body decoration-text/30 hover:decoration-text font-bold text-balance underline"
				>
					{product.name}
				</Link>
				{details && <p className="text-small text-text-soft">{details}</p>}
			</div>
			{missing > 0 ? (
				<p className="label-caps text-small bg-field text-on-field self-start px-2 py-0.5">
					{votes === 0
						? "Nessun voto"
						: missing === 1
							? "Manca 1 voto alla classifica"
							: `Mancano ${missing} voti alla classifica`}
				</p>
			) : product.votesCount < MIN_VOTES_TO_RANK ? (
				// The reader's vote just put it on the board; its share is computed by the ranking.
				<p className="label-caps text-small bg-text text-ground self-start px-2 py-0.5">
					Entrata in classifica
				</p>
			) : (
				// In search results a ranked product shows its verdict, set like a price.
				<p className="flex items-baseline gap-2">
					<span className="font-condensed text-lead leading-none font-black tabular-nums">
						{product.rebuyPercent}%
					</span>
					<span className="text-small font-semibold">
						la ricompra su {count(product.votesCount, VOTI)}
					</span>
				</p>
			)}
			<div className="mt-auto">
				<QuickVote
					productId={product.id}
					ean={product.ean}
					name={product.name}
					initial={product.myScore}
					votesCount={product.votesCount}
					onVoted={setMyScore}
					demo={demo}
				/>
			</div>
		</article>
	);
}
