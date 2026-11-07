import { useEffect, useRef, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";

import { Button } from "@/components/ds/button";
import { HeartButton } from "@/components/ds/heart-button";
import { PackPhoto } from "@/components/ds/pack-photo";
import { Sheet } from "@/components/ds/sheet";
import { RatingBadge } from "@/components/ds/stars";
import { productDetails } from "@/lib/catalog/details";
import { catalogQueries } from "@/lib/catalog/queries";
import type { ProductCard } from "@/lib/catalog/types";
import { VOTI, count } from "@/lib/plural";
import { MIN_VOTES_TO_RANK } from "@/lib/ranking/rules";

import { AdminShortcut } from "./admin-shortcut";
import { SoupSections, SoupWarnings } from "./soup-detail";
import { VotePanel, useVote } from "./vote-panel";

// The soup's sheet: tapping a soup in a list opens it over the page instead of leaving it. It
// lives in the history state of the page underneath, so the back button (or the swipe back)
// closes it; pulled up, it shows the whole soup.

// Whether the open sheet was opened by a tap in this tab: then closing it is going back. A
// sheet restored by a reload has no entry of ours behind it to go back to.
let openedHere = false;

/** Opens a soup's sheet over the current page, as a new history entry. */
export function useOpenSoup() {
	const navigate = useNavigate();
	return (ean: string) => {
		openedHere = true;
		return navigate({
			to: ".",
			search: prev => prev,
			params: prev => prev,
			state: prev => ({ ...prev, zuppa: ean }),
			resetScroll: false,
		});
	};
}

/**
 * A link to a soup: a real link to its page (a new tab, a shared URL, no JavaScript), which a
 * plain tap turns into its sheet.
 */
export function SoupLink({
	ean,
	label,
	className,
	children,
}: {
	ean: string;
	/** A fuller name for screen readers, when the visible text is not enough («1° posto: …»). */
	label?: string;
	className?: string;
	children: React.ReactNode;
}) {
	const open = useOpenSoup();
	return (
		<Link
			to="/prodotti/$ean"
			params={{ ean }}
			aria-label={label}
			className={className}
			onClick={event => {
				if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0)
					return;
				event.preventDefault();
				open(ean);
			}}
		>
			{children}
		</Link>
	);
}

/** In the root layout: shows the sheet of the soup named in the history state, if any. */
export function SoupSheetHost() {
	// The history state is only in the browser: a page reloaded with a sheet open renders on the
	// server without it, so the sheet waits until after hydration.
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);
	const ean = useRouterState({
		select: state =>
			state.location.pathname.startsWith("/prodotti")
				? undefined
				: state.location.state.zuppa,
	});
	if (!mounted || !ean) return null;
	return <SoupSheet key={ean} ean={ean} />;
}

function SoupSheet({ ean }: { ean: string }) {
	const router = useRouter();
	const navigate = useNavigate();
	const query = useQuery(catalogQueries.card(ean));
	const { isError } = query;
	// A card cached before a vote cast elsewhere would start the stars from the old vote: wait
	// for a fresh one (a fresh cache is shown at once). Once shown, it stays: the vote cast here
	// marks the card stale, and going back to the skeleton until it reloads would flash the photo
	// and reset the stars.
	const shown = useRef(false);
	const ready = shown.current || query.isFetchedAfterMount || !query.isStale;
	const product = ready ? query.data : undefined;
	if (product) shown.current = true;

	/** Once slid away: back to the page without it. */
	function closed() {
		// Opened from this page: going back removes its history entry. Reached cold (a reload
		// keeps the state): drop the state in place instead of leaving the site.
		if (openedHere) {
			openedHere = false;
			router.history.back();
		} else
			navigate({
				to: ".",
				search: prev => prev,
				params: prev => prev,
				state: prev => ({ ...prev, zuppa: undefined }),
				replace: true,
				resetScroll: false,
			});
	}

	const thumb = (
		<span className="plate rounded-thumb grid size-16 shrink-0 place-items-center overflow-hidden bg-white lg:hidden">
			{product && (
				<PackPhoto
					src={product.imageUrl}
					alt=""
					size="thumb"
					className="size-full rounded-none object-cover"
				/>
			)}
		</span>
	);

	return (
		// Two heights on a phone: the preview (name, rating, the vote) and, dragged up, the whole soup.
		// The header is the sheet's own, as on every sheet; while the soup is on its way it holds
		// the shapes of the name and details.
		<Sheet
			title={
				product ? (
					product.name
				) : isError ? (
					"Questa zuppa non si apre"
				) : (
					<>
						<span className="sr-only" role="status">
							Apro la zuppa…
						</span>
						<span aria-hidden className="skeleton block h-5 w-3/4 rounded-full" />
					</>
				)
			}
			subtitle={
				product ? (
					productDetails(product)
				) : isError ? undefined : (
					<span aria-hidden className="skeleton block h-4 w-1/2 rounded-full" />
				)
			}
			media={
				isError ? undefined : product ? (
					thumb
				) : (
					<span className="skeleton rounded-thumb size-16 shrink-0 lg:hidden" />
				)
			}
			onClosed={closed}
			detents
		>
			{close =>
				product ? (
					<SheetBody key={product.id} product={product} />
				) : isError ? (
					<div
						data-sheet-peek
						className="flex flex-col items-center gap-4 pb-4 text-center"
					>
						<p className="text-body">Controlla la connessione e riprova.</p>
						<div className="flex gap-2">
							<Button variant="ink" onClick={() => query.refetch()}>
								Riprova
							</Button>
							<Button onClick={close}>Chiudi</Button>
						</div>
					</div>
				) : (
					<SheetSkeleton />
				)
			}
		</Sheet>
	);
}

function SheetBody({ product }: { product: ProductCard }) {
	const vote = useVote(product);
	return (
		<div className="flex flex-col gap-8">
			{/* The preview, down to the stars (marked inside the vote panel): how it ranks and your
			    vote, under the sheet's header. Pulled up, the rest. */}
			<div className="flex flex-col gap-4">
				{/* On a wide screen the panel has room for the pack itself, as on its page. */}
				<div className="plate rounded-card hidden h-64 place-items-center overflow-hidden bg-white p-4 lg:grid">
					<PackPhoto
						src={product.imageUrl}
						alt={`Confezione di ${product.name}`}
						size="shelf"
						className="max-h-full object-contain"
					/>
				</div>
				{/* How it ranks, with the heart at the other end: far from the close button. */}
				<div className="flex items-center justify-between gap-3">
					<RankLine product={product} />
					<HeartButton productId={product.id} name={product.name} />
				</div>
				<VotePanel product={product} vote={vote} peek />
			</div>

			<SoupWarnings product={product} />
			<SoupSections product={product} />
			<AdminShortcut product={product} variant="row" />
		</div>
	);
}

/** The soup's standing in one quiet line: its mean and place, or how far it is from the ranking. */
function RankLine({ product }: { product: ProductCard }) {
	const { stats } = product;
	const missing = MIN_VOTES_TO_RANK - stats.votesCount;
	if (stats.votesCount === 0)
		return <p className="text-small text-text-soft">Ancora nessun voto</p>;
	if (missing > 0)
		return (
			<p className="text-small text-text-soft tabular-nums">
				{count(stats.votesCount, VOTI)} ·{" "}
				{missing === 1 ? "ne manca 1" : `ne mancano ${missing}`} per la classifica
			</p>
		);
	return (
		<p className="flex flex-wrap items-center gap-2">
			<RatingBadge mean={stats.mean} votesCount={stats.votesCount} size="sm" />
			<span className="text-small text-text-soft tabular-nums">
				{count(stats.votesCount, VOTI)}
				{stats.rank && ` · ${stats.rank}° in classifica`}
			</span>
		</p>
	);
}

function SheetSkeleton() {
	return (
		// The same shape as the soup's preview, so the sheet opens at the height it will keep.
		<div aria-busy className="flex flex-col gap-4">
			<div className="flex min-h-11 items-center justify-between gap-3">
				<span className="skeleton h-4 w-2/3 rounded-full" />
				<span className="skeleton size-11 rounded-full" />
			</div>
			<span data-sheet-peek className="skeleton rounded-panel h-44" />
		</div>
	);
}
