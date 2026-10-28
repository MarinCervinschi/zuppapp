import { Link } from "@tanstack/react-router";

import { HeartButton } from "@/components/ds/heart-button";
import { RatingBadge, formatStars } from "@/components/ds/stars";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { productDetails } from "@/lib/catalog/details";
import { sizedImage } from "@/lib/catalog/image";
import type { ProductListItem } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

// The ranking: the first three as big cards, their packs large, then one line each.

// Gold, the sky of a silver medal, and pumpkin for bronze: the podium's three discs.
const MEDALS: Record<number, string> = {
	1: "bg-soup-corn",
	2: "bg-[#cfe3f5]",
	3: "bg-soup-pumpkin",
};

function RankDisc({ rank, className }: { rank: number; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				"font-display text-body flex size-9 items-center justify-center rounded-full font-semibold text-[#16120f] tabular-nums",
				MEDALS[rank] ?? "bg-ground-raised",
				className
			)}
		>
			{rank}
		</span>
	);
}

/** «1° posto: name, brand, 4,7 stelle»: what a screen reader hears for the whole card. */
function accessibleName(product: ProductListItem) {
	return [
		`${product.rank}° posto: ${product.name}`,
		product.brand,
		product.mean !== null &&
			`${formatStars(product.mean)} stelle su 5, ${count(product.votesCount, VOTI)}`,
	]
		.filter(Boolean)
		.join(", ");
}

/**
 * The product's name as the card's one link, stretched over the whole card by a pseudo
 * element: anywhere on the card opens the product, except the photo, which sits above the
 * stretch and opens large. One link per card, so a screen reader hears one name, not five.
 */
function StretchedLink({
	product,
	className,
}: {
	product: ProductListItem;
	className?: string;
}) {
	return (
		<Link
			to="/prodotti/$ean"
			params={{ ean: product.ean }}
			aria-label={accessibleName(product)}
			className={cn("no-underline after:absolute after:inset-0", className)}
		>
			{product.name}
		</Link>
	);
}

/** The three on the podium: the pack on a wide white plate, its place and rating on the corners. */
export function Podium({ products }: { products: ProductListItem[] }) {
	if (products.length === 0) return null;

	return (
		<ol className="stagger grid gap-8 md:grid-cols-3 md:gap-5">
			{products.map(product => (
				<li key={product.id}>
					<article className="group relative flex flex-col gap-3">
						<div className="plate rounded-card relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-white">
							<ZoomablePhoto
								src={product.imageUrl}
								name={product.name}
								ean={product.ean}
								size="shelf"
								thumb={400}
								className="flex size-full"
								imageClassName="size-full object-cover"
							/>
							<RankDisc
								rank={product.rank ?? 0}
								className="absolute top-3 left-3 z-20"
							/>
							<HeartButton
								productId={product.id}
								name={product.name}
								className="absolute top-3 right-3 z-20"
							/>
							<RatingBadge
								mean={product.mean}
								votesCount={product.votesCount}
								className="absolute right-3 bottom-3 z-20"
							/>
						</div>
						<div className="flex flex-col gap-1 px-1">
							<StretchedLink
								product={product}
								className="font-display text-lead font-medium group-hover:underline"
							/>
							<p className="text-small text-text-soft">
								{productDetails(product)}
								<span className="tabular-nums">
									{" "}
									• {count(product.votesCount, VOTI)}
								</span>
							</p>
						</div>
					</article>
				</li>
			))}
		</ol>
	);
}

/** Fourth place down: one line each, place, a round thumbnail, name, rating. */
export function Leaderboard({
	products,
	start,
}: {
	products: ProductListItem[];
	start: number;
}) {
	if (products.length === 0) return null;
	return (
		<ol start={start} className="stagger flex flex-col">
			{products.map(product => (
				<li key={product.id} className="nutrient-row last:border-b-0">
					<article className="group relative grid grid-cols-[2rem_auto_1fr_auto] items-center gap-3 py-3">
						<span
							aria-hidden
							className="font-display text-lead text-center font-medium tabular-nums"
						>
							{product.rank}
						</span>
						{product.imageUrl ? (
							<img
								src={sizedImage(product.imageUrl, 100) ?? product.imageUrl}
								alt=""
								loading="lazy"
								decoding="async"
								className="size-14 rounded-full bg-white object-contain p-1"
							/>
						) : (
							<span aria-hidden className="bg-ground-raised size-14 rounded-full" />
						)}
						<div className="flex min-w-0 flex-col gap-0.5">
							<StretchedLink
								product={product}
								className="font-display text-body font-medium group-hover:underline"
							/>
							<p className="text-small text-text-soft">{productDetails(product)}</p>
						</div>
						<span className="flex flex-col items-end gap-0.5">
							<RatingBadge
								mean={product.mean}
								votesCount={product.votesCount}
								size="sm"
							/>
							<span aria-hidden className="text-small text-text-soft tabular-nums">
								{count(product.votesCount, VOTI)}
							</span>
						</span>
					</article>
				</li>
			))}
		</ol>
	);
}
