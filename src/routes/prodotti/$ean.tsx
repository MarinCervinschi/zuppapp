import { useEffect, useRef } from "react";

import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { DetailBar } from "@/components/ds/app-bar";
import { HeartButton } from "@/components/ds/heart-button";
import { RatingBadge } from "@/components/ds/stars";
import { ZoomablePhoto } from "@/components/ds/zoomable-photo";
import { NotFoundPage } from "@/components/error/error-pages";
import { AdminShortcut } from "@/components/product/admin-shortcut";
import { SoupSections, SoupWarnings } from "@/components/product/soup-detail";
import { VotePanel, useVote } from "@/components/product/vote-panel";
import { productDetails } from "@/lib/catalog/details";
import { catalogQueries } from "@/lib/catalog/queries";
import type { ProductCard } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";

export const Route = createFileRoute("/prodotti/$ean")({
	loader: async ({ context, params }) => {
		// fetchQuery, not ensureQueryData: a card made stale by a vote elsewhere is fetched again
		// before the page shows, so the vote panel never starts from the old vote.
		const product = await context.queryClient.fetchQuery(
			catalogQueries.card(params.ean)
		);
		return {
			title: product.brand ? `${product.name} · ${product.brand}` : product.name,
		};
	},
	head: ({ loaderData }) => ({
		meta: loaderData ? [{ title: `${loaderData.title} · Zuppapp` }] : [],
	}),
	component: ProductPage,
	notFoundComponent: NotFoundPage,
});

function ProductPage() {
	const { ean } = Route.useParams();
	const { data: product } = useSuspenseQuery(catalogQueries.card(ean));
	return <ProductView key={product.id} product={product} />;
}

function ProductView({ product }: { product: ProductCard }) {
	const vote = useVote(product);
	const { stats } = product;
	const sheet = useRef<HTMLDivElement>(null);
	useDragToLeave(sheet);

	return (
		// Phone: the photo full width and a sheet sliding over it. Desktop (≥ 1024 px): two columns,
		// the pack held still on the left while everything else scrolls on the right.
		<main className="mx-auto max-w-xl lg:grid lg:max-w-6xl lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start lg:gap-12 lg:px-6 lg:pt-24">
			<DetailBar
				action={
					<div className="flex items-center gap-2">
						<AdminShortcut product={product} />
						<HeartButton productId={product.id} name={product.name} size="lg" />
					</div>
				}
			/>
			{/* The pack, full width on its white plate, under the fixed bar. */}
			<div className="plate rounded-card relative flex h-80 items-center justify-center bg-white px-4 pt-4 pb-10 max-lg:rounded-none sm:h-96 lg:sticky lg:top-24 lg:h-[min(34rem,calc(100dvh-8rem))] lg:p-8">
				{product.imageUrl ? (
					<ZoomablePhoto
						src={product.imageUrl}
						name={product.name}
						size="shelf"
						thumb={400}
						className="flex h-full items-center justify-center"
						imageClassName="h-full max-h-full max-w-full"
					/>
				) : (
					<span className="font-display text-lead text-[#6a5f53]">Senza foto</span>
				)}
			</div>

			{/* The sheet over the photo, warm yellow at the top fading into the paper: on a phone it is
			    the soup's sheet, opened all the way, and like it it is dragged down to go back. */}
			<div
				ref={sheet}
				className="sheet-tint sheet-panel stagger relative -mt-8 flex flex-col gap-10 rounded-t-[2rem] px-4 pt-2 lg:mt-0 lg:rounded-[2rem] lg:px-8 lg:pt-8"
			>
				<span
					aria-hidden
					data-drag
					className="-mb-6 flex h-7 w-24 touch-none items-center justify-center self-center lg:hidden"
				>
					<span className="bg-text/25 h-1.5 w-10 rounded-full" />
				</span>
				<header data-drag className="flex flex-col gap-3">
					<h1 className="font-display text-title lg:text-display font-semibold tracking-[-0.01em]">
						{product.name}
					</h1>
					<p className="text-body text-text-soft">{productDetails(product)}</p>
					<p className="flex flex-wrap items-center gap-2">
						<RatingBadge mean={stats.mean} votesCount={stats.votesCount} />
						{stats.votesCount > 0 && (
							<span aria-hidden className="text-body text-text-soft tabular-nums">
								({count(stats.votesCount, VOTI)})
							</span>
						)}
						{stats.rank && (
							<span className="text-body text-text-soft">
								· {stats.rank}° in classifica
							</span>
						)}
					</p>
				</header>

				<SoupWarnings product={product} />

				<VotePanel product={product} vote={vote} />

				<SoupSections product={product} />
			</div>
		</main>
	);
}

// How far the sheet must be pulled down, or how fast, to go back.
const LEAVE_PX = 120;
const LEAVE_SPEED = 0.7;

/**
 * On a phone, the page's sheet drags down by its handle or its header, like the soup's sheet: let go
 * far or fast enough and it slides away and goes back (to the soups, for a link opened cold); a
 * short pull springs back. With reduced motion it does not slide away, it just goes.
 */
function useDragToLeave(sheet: React.RefObject<HTMLDivElement | null>) {
	const router = useRouter();

	useEffect(() => {
		const element = sheet.current;
		if (!element) return;
		const wide = window.matchMedia("(min-width: 64rem)");
		const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
		let start: { y: number; t: number } | null = null;
		let dy = 0;

		function leave() {
			if (window.history.length > 1) router.history.back();
			else router.navigate({ to: "/" });
		}
		function down(event: PointerEvent) {
			if (wide.matches || event.button !== 0) return;
			const target = event.target as HTMLElement;
			if (!target.closest("[data-drag]") || target.closest("button, a")) return;
			start = { y: event.clientY, t: event.timeStamp };
			dy = 0;
			try {
				element!.setPointerCapture(event.pointerId);
			} catch {}
		}
		function move(event: PointerEvent) {
			if (!start) return;
			dy = event.clientY - start.y;
			if (!element!.dataset.dragging && Math.abs(dy) < 4) return;
			element!.dataset.dragging = "true";
			// Upwards it barely moves: the page is already as open as it gets.
			element!.style.setProperty("--y", `${dy < 0 ? dy / 4 : dy}px`);
		}
		function up(event: PointerEvent) {
			if (!start) return;
			const speed = dy / Math.max(1, event.timeStamp - start.t);
			start = null;
			delete element!.dataset.dragging;
			if (dy > LEAVE_PX || (dy > 24 && speed > LEAVE_SPEED)) {
				if (reduced.matches) return leave();
				element!.style.setProperty("--y", `${window.innerHeight}px`);
				setTimeout(leave, 300);
			} else element!.style.setProperty("--y", "0px");
		}

		element.addEventListener("pointerdown", down);
		element.addEventListener("pointermove", move);
		element.addEventListener("pointerup", up);
		element.addEventListener("pointercancel", up);
		return () => {
			element.removeEventListener("pointerdown", down);
			element.removeEventListener("pointermove", move);
			element.removeEventListener("pointerup", up);
			element.removeEventListener("pointercancel", up);
		};
	}, [sheet, router]);
}
