import { Link } from "@tanstack/react-router";

import { ScoreSpread } from "@/components/ds/score-spread";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { subtypeLabel } from "@/lib/catalog/labels";
import type { ProductListItem } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

// The ranking is set like the front of a supermarket flyer: the winner is the big offer on
// the cover, the next two flank it, everyone else is a line in the list. Where a flyer
// prints the price, Zuppapp prints the share of people who would buy it again.

const votes = (n: number) => count(n, VOTI);

function details(product: ProductListItem) {
	return [product.brand, product.subtype && subtypeLabel(product.subtype).toLowerCase()]
		.filter(Boolean)
		.join(" · ");
}

/** The rank as a flyer prints a price: huge, condensed, black. */
function RankNumeral({ rank, className }: { rank: number; className?: string }) {
	return (
		<span
			aria-hidden
			className={cn(
				"font-condensed font-black tracking-[-0.04em] tabular-nums",
				className
			)}
		>
			{rank}
		</span>
	);
}

function Figure({ product, big }: { product: ProductListItem; big?: boolean }) {
	return (
		<p className="flex flex-col">
			<span
				className={cn(
					"font-condensed leading-[0.85] font-black tracking-[-0.03em] tabular-nums",
					big ? "text-figure" : "text-figure-sm"
				)}
			>
				{product.rebuyPercent}
				<span className="text-[0.5em]">%</span>
			</span>
			<span className="text-small font-semibold">
				la ricompra · {votes(product.votesCount)}
			</span>
		</p>
	);
}

/**
 * The three on the podium. The first is the cover: the yellow of the shelf edge, its pack
 * large. Each card is one link named by its rank and product.
 */
export function Podium({ products }: { products: ProductListItem[] }) {
	const [first, ...rest] = products;
	if (!first) return null;

	return (
		<ol className="grid gap-3 md:grid-cols-12 md:gap-4">
			<li className="md:col-span-7 md:row-span-2">
				<article className="bg-field on-field relative grid h-full grid-cols-1 gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
					<div className="flex flex-col gap-4">
						<p className="flex items-end gap-3">
							<RankNumeral rank={1} className="text-rank-hero" />
							<span className="font-condensed text-lead pb-2 font-black uppercase">
								La più
								<br />
								ricomprata
							</span>
						</p>
						<div className="flex flex-col gap-1">
							<StretchedLink
								product={first}
								label="Primo posto"
								className="font-semicondensed text-title font-extrabold tracking-[-0.02em] text-balance"
							/>
							<p className="text-body">{details(first)}</p>
						</div>
						<Figure product={first} big />
						<ScoreSpread counts={first.scoreCounts} className="max-w-sm" />
					</div>
					<div className="row-start-1 flex items-start justify-start sm:col-start-2 sm:justify-end">
						{/* The pack on a white plate, as a flyer cuts out its products. */}
						<ZoomablePhoto
							src={first.imageUrl}
							name={first.name}
							size="shelf"
							thumb={400}
							className="bg-white p-2"
							imageClassName="max-h-48 outline-none sm:max-h-64"
						/>
					</div>
				</article>
			</li>
			{rest.map(product => (
				<li key={product.id} className="md:col-span-5">
					<article className="bg-ground-raised has-[a:hover]:bg-text/10 relative grid h-full grid-cols-[auto_minmax(0,1fr)] items-start gap-4 p-4 transition-[background-color] duration-150 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:p-5">
						<RankNumeral rank={product.rank ?? 0} className="text-rank" />
						<div className="flex min-w-0 flex-col gap-2">
							<StretchedLink
								product={product}
								label={product.rank === 2 ? "Secondo posto" : "Terzo posto"}
								className="font-semicondensed text-lead font-bold text-balance"
							/>
							<p className="text-small text-text-soft">{details(product)}</p>
							<Figure product={product} />
							<ScoreSpread counts={product.scoreCounts} />
						</div>
						{/* Beside the name when there is room; under it on a narrow screen or with large text. */}
						<ZoomablePhoto
							src={product.imageUrl}
							name={product.name}
							size="thumb"
							className="col-start-2 justify-self-start sm:col-start-3 sm:row-start-1"
							imageClassName="size-20"
						/>
					</article>
				</li>
			))}
		</ol>
	);
}

/**
 * The product's name as the card's one link, stretched over the whole card by a pseudo
 * element: anywhere on the card opens the product, except the photo, which sits above the
 * stretch and opens large. One link per card, so a screen reader hears one name, not five.
 */
function StretchedLink({
	product,
	label,
	className,
}: {
	product: ProductListItem;
	label: string;
	className?: string;
}) {
	return (
		<Link
			to="/prodotti/$ean"
			params={{ ean: product.ean }}
			aria-label={`${label}: ${product.name}${product.brand ? `, ${product.brand}` : ""}, ${product.rebuyPercent}% la ricompra`}
			className={cn("no-underline after:absolute after:inset-0", className)}
		>
			{product.name}
		</Link>
	);
}

/** Fourth place down: one line each, rank, pack, name, spread, figure. */
export function Leaderboard({
	products,
	start,
}: {
	products: ProductListItem[];
	start: number;
}) {
	if (products.length === 0) return null;
	return (
		<ol start={start} className="flex flex-col gap-2">
			{products.map(product => (
				<li key={product.id}>
					<article className="bg-ground-raised has-[a:hover]:bg-text/10 relative grid grid-cols-[3rem_auto_1fr_auto] items-center gap-3 p-3 transition-[background-color] duration-150 sm:grid-cols-[3.5rem_auto_1fr_auto] sm:gap-4">
						<RankNumeral rank={product.rank ?? 0} className="text-title text-right" />
						<ZoomablePhoto
							src={product.imageUrl}
							name={product.name}
							size="thumb"
							thumb={100}
							imageClassName="size-12"
						/>
						<div className="flex min-w-0 flex-col gap-1.5">
							<StretchedLink
								product={product}
								label={`${product.rank}° posto`}
								className="font-semicondensed text-body font-bold text-balance"
							/>
							<p className="text-small text-text-soft">{details(product)}</p>
							<ScoreSpread counts={product.scoreCounts} className="max-w-48" />
						</div>
						<p className="flex flex-col items-end">
							<span className="font-condensed text-lead leading-none font-black tabular-nums">
								{product.rebuyPercent}%
							</span>
							<span className="text-small font-semibold tabular-nums">
								su {votes(product.votesCount)}
							</span>
						</p>
					</article>
				</li>
			))}
		</ol>
	);
}
