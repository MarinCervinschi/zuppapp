import { HeartButton } from "@/components/ds/heart-button";
import { PackPhoto } from "@/components/ds/pack-photo";
import { MissingVotesBadge, MyScoreBadge, RatingBadge } from "@/components/ds/stars";
import { SoupLink } from "@/components/product/soup-sheet";
import { productDetails } from "@/lib/catalog/details";
import type { ProductListItem } from "@/lib/catalog/types";
import { MIN_VOTES_TO_RANK } from "@/lib/ranking/rules";

/**
 * A soup in a list, big like a post in a feed: its pack fills the plate, the rating (or the
 * votes still missing) sits on the photo, and under it only the name and the details. The whole
 * card is one link, the name stretched over it: a tap opens the soup's sheet, where you vote.
 */
export function TasteTile({ product }: { product: ProductListItem }) {
	const missing = MIN_VOTES_TO_RANK - product.votesCount;
	const details = productDetails(product);

	return (
		<article className="group relative flex h-full flex-col gap-3">
			<div className="plate rounded-card relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-white sm:aspect-square">
				{product.imageUrl ? (
					<PackPhoto
						src={product.imageUrl}
						alt=""
						size="shelf"
						className="size-full max-h-none object-cover transition-[scale] duration-500 ease-[var(--ease-out-snap)] group-hover:scale-[1.03]"
					/>
				) : (
					<span className="font-display text-lead text-[#6a5f53]">Senza foto</span>
				)}
				{product.myScore && (
					<MyScoreBadge
						score={product.myScore}
						className="absolute top-3 left-3 py-1"
					/>
				)}
				<span className="absolute bottom-3 left-3">
					{missing > 0 ? (
						<MissingVotesBadge votesCount={product.votesCount} className="py-1" />
					) : (
						<RatingBadge
							mean={product.mean}
							votesCount={product.votesCount}
							size="sm"
						/>
					)}
				</span>
			</div>
			<div className="flex flex-col gap-0.5 px-1">
				<SoupLink
					ean={product.ean}
					className="font-display text-lead font-medium text-balance no-underline group-hover:underline after:absolute after:inset-0 after:z-10 after:rounded-[1.75rem]"
				>
					{product.name}
				</SoupLink>
				{details && <p className="text-small text-text-soft">{details}</p>}
			</div>
			{/* Above the stretched link, so the heart stays its own button. */}
			<HeartButton
				productId={product.id}
				name={product.name}
				className="absolute top-3 right-3 z-20"
			/>
		</article>
	);
}
