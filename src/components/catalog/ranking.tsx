import { HeartButton } from "@/components/ds/heart-button";
import { PackPhoto } from "@/components/ds/pack-photo";
import { RatingBadge, formatStars } from "@/components/ds/stars";
import { SoupLink } from "@/components/product/soup-sheet";
import { productDetails } from "@/lib/catalog/details";
import { sizedImage } from "@/lib/catalog/image";
import type { ProductListItem } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";
import { cn } from "@/lib/utils";

// The ranking: the first three as cards on a podium, the first one bigger, then one row each.
// Every soup opens its sheet, where it is voted.

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
				"font-display flex items-center justify-center rounded-full font-semibold text-[#16120f] tabular-nums",
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
 * The three on the podium. On a phone the first fills the width and the other two share a row;
 * on a wide screen they stand side by side, the first in the middle and taller.
 */
export function Podium({ products }: { products: ProductListItem[] }) {
	if (products.length === 0) return null;

	return (
		<ol className="stagger grid grid-cols-2 gap-3 md:grid-cols-3 md:items-end md:gap-5">
			{products.map(product => {
				const first = product.rank === 1;
				return (
					<li
						key={product.id}
						className={cn(
							first && "col-span-2 md:order-2 md:col-span-1",
							product.rank === 2 && "md:order-1",
							product.rank === 3 && "md:order-3"
						)}
					>
						<article
							className={cn(
								"group bg-ground-raised rounded-card relative flex flex-col gap-3 p-2.5 pb-4 transition-[scale] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.98]",
								first && "outline-soup-corn outline-2"
							)}
						>
							<div
								className={cn(
									"plate relative flex items-center justify-center overflow-hidden rounded-[1.25rem] bg-white",
									first ? "aspect-[16/10] md:aspect-[4/5]" : "aspect-square"
								)}
							>
								<PackPhoto
									src={product.imageUrl}
									alt=""
									size="shelf"
									className="size-full max-h-none object-cover transition-[scale] duration-500 ease-[var(--ease-out-snap)] group-hover:scale-[1.03]"
								/>
								<RankDisc
									rank={product.rank ?? 0}
									className={cn(
										"absolute top-2.5 left-2.5",
										first ? "text-lead size-11" : "text-body size-9"
									)}
								/>
								<RatingBadge
									mean={product.mean}
									votesCount={product.votesCount}
									size={first ? "md" : "sm"}
									className="absolute bottom-2.5 left-2.5"
								/>
							</div>
							<div className="flex flex-col gap-0.5 px-1.5">
								<SoupLink
									ean={product.ean}
									label={accessibleName(product)}
									className={cn(
										"font-display font-medium text-balance no-underline group-hover:underline after:absolute after:inset-0 after:z-10 after:rounded-[1.75rem]",
										first ? "text-lead" : "text-body leading-snug"
									)}
								>
									{product.name}
								</SoupLink>
								<p className="text-small text-text-soft">
									{first && productDetails(product) && `${productDetails(product)} • `}
									<span className="tabular-nums">
										{count(product.votesCount, VOTI)}
									</span>
								</p>
							</div>
							{/* Above the stretched link: the heart stays its own button. */}
							<HeartButton
								productId={product.id}
								name={product.name}
								className="absolute top-5 right-5 z-20"
							/>
						</article>
					</li>
				);
			})}
		</ol>
	);
}

/** Fourth place down: a row each, as cards a thumb can press, place, round photo, name, rating. */
export function Leaderboard({
	products,
	start,
}: {
	products: ProductListItem[];
	start: number;
}) {
	if (products.length === 0) return null;
	return (
		<ol start={start} className="stagger grid gap-2 md:grid-cols-2 md:gap-x-5">
			{products.map(product => (
				<li key={product.id}>
					<article className="group bg-ground-raised hover:bg-text/[0.06] relative grid grid-cols-[2.25rem_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.5rem] p-2 pr-3 transition-[scale,background-color] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.98]">
						<span
							aria-hidden
							className="font-display text-lead text-text-soft text-center font-semibold tabular-nums"
						>
							{product.rank}
						</span>
						{product.imageUrl ? (
							<img
								src={sizedImage(product.imageUrl, 100) ?? product.imageUrl}
								alt=""
								loading="lazy"
								decoding="async"
								className="size-14 rounded-full bg-white object-cover"
							/>
						) : (
							<span aria-hidden className="bg-ground size-14 rounded-full" />
						)}
						<div className="flex min-w-0 flex-col gap-0.5">
							<SoupLink
								ean={product.ean}
								label={accessibleName(product)}
								className="font-display text-body font-medium no-underline group-hover:underline after:absolute after:inset-0 after:rounded-[1.5rem]"
							>
								{product.name}
							</SoupLink>
							<p className="text-small text-text-soft">
								{[product.brand, count(product.votesCount, VOTI)]
									.filter(Boolean)
									.join(" • ")}
							</p>
						</div>
						<RatingBadge
							mean={product.mean}
							votesCount={product.votesCount}
							size="sm"
						/>
					</article>
				</li>
			))}
		</ol>
	);
}
