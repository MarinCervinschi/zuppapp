import { useState } from "react";

import { Link } from "@tanstack/react-router";

import { RatingBadge } from "@/components/ds/stars";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { productDetails } from "@/lib/catalog/details";
import type { ProductListItem } from "@/lib/catalog/types";
import { MIN_VOTES_TO_RANK, type Score } from "@/lib/ranking/rules";

import { QuickVote } from "./quick-vote";

/**
 * A product in a grid: its pack on a white plate, because that is how people find it on the
 * shelf, the rating on the plate's corner, the name, and the stars to vote it.
 */
export function TasteTile({
	product,
	demo,
}: {
	product: ProductListItem;
	demo?: boolean;
}) {
	// The reader's own vote counts at once, so the card never says "Nessun voto" under their stars.
	const [myScore, setMyScore] = useState<Score | null>(product.myScore);
	const votes = product.votesCount + (myScore && !product.myScore ? 1 : 0);
	const missing = MIN_VOTES_TO_RANK - votes;
	const details = productDetails(product);

	return (
		<article className="flex h-full flex-col gap-3">
			<div className="plate rounded-card relative flex aspect-[4/3] items-center justify-center bg-white p-4 sm:aspect-square">
				{product.imageUrl ? (
					<ZoomablePhoto
						src={product.imageUrl}
						name={product.name}
						size="shelf"
						className="flex max-h-full items-center justify-center"
						imageClassName="max-h-full"
					/>
				) : (
					<span className="font-display text-lead text-[#6a5f53]">Senza foto</span>
				)}
				{product.mean !== null && votes >= MIN_VOTES_TO_RANK && (
					<RatingBadge
						mean={product.mean}
						votesCount={product.votesCount}
						size="sm"
						className="absolute right-3 bottom-3"
					/>
				)}
			</div>
			<div className="flex flex-col gap-1 px-1">
				<Link
					to="/prodotti/$ean"
					params={{ ean: product.ean }}
					className="font-display text-lead font-medium no-underline hover:underline"
				>
					{product.name}
				</Link>
				{details && <p className="text-small text-text-soft">{details}</p>}
			</div>
			{missing > 0 ? (
				<p className="text-small bg-field text-on-field mx-1 self-start rounded-full px-2.5 py-0.5 font-medium">
					{votes === 0
						? "Nessun voto"
						: missing === 1
							? "Manca 1 voto alla classifica"
							: `Mancano ${missing} voti alla classifica`}
				</p>
			) : (
				product.votesCount < MIN_VOTES_TO_RANK && (
					// The reader's vote just put it on the board; its mean comes with the ranking.
					<p className="text-small bg-ink text-on-ink mx-1 self-start rounded-full px-2.5 py-0.5 font-medium">
						Entrata in classifica
					</p>
				)
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
