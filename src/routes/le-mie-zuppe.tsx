import { useEffect, useRef } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { buttonClass } from "@/components/ds/button";
import { HeartButton } from "@/components/ds/heart-button";
import { ArrowRightIcon } from "@/components/ds/icons";
import { PageHead } from "@/components/ds/page-head";
import { RatingBadge, StarIcon } from "@/components/ds/stars";
import { SoupLink } from "@/components/product/soup-sheet";
import { productDetails } from "@/lib/catalog/details";
import { sizedImage } from "@/lib/catalog/image";
import { EXACT_SEARCH } from "@/lib/catalog/schemas";
import type { ProductListItem } from "@/lib/catalog/types";
import { favoriteQueries } from "@/lib/favorites/queries";
import { MIN_VOTES_TO_RANK, SCORE_LABELS } from "@/lib/ranking/rules";
import { userQueries } from "@/lib/user/queries";
import { myVotesSchema } from "@/lib/user/schemas";
import type { MyVote } from "@/lib/user/service";
import { cn } from "@/lib/utils";

// «Le tue zuppe»: the soups you voted and the ones you keep a heart on, the same thing seen from
// two sides, so one page with two tabs. The tab is in the URL: a link, the back button, a share.

export const Route = createFileRoute("/le-mie-zuppe")({
	validateSearch: myVotesSchema,
	loaderDeps: ({ search }) => search,
	// fetchQuery, not ensureQueryData: after a vote changed elsewhere the list is stale, and it
	// is fetched again before the page shows instead of flashing the old one first.
	loader: async ({ context: { queryClient }, deps }) => {
		const page = deps.pagina ?? 1;
		if (deps.scheda !== "preferite")
			return queryClient.fetchQuery(userQueries.myVotes(page));
		// Hearts belong to an account: without one the tab explains that instead of asking.
		const { viewer } = await queryClient.ensureQueryData(userQueries.viewer());
		if (viewer && !viewer.isAnonymous)
			await queryClient.fetchQuery(favoriteQueries.page(page));
	},
	head: () => ({ meta: [{ title: "Le tue zuppe · Zuppapp" }] }),
	component: MySoups,
});

const date = new Intl.DateTimeFormat("it-IT", { day: "numeric", month: "long" });
const SIGN = { positive: "+", negative: "−", neutral: "·" } as const;

// A row a thumb can press, as in the ranking: photo, words, and what is yours on the right.
const rowCard =
	"group bg-ground-raised hover:bg-text/[0.06] relative grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.5rem] p-2 pr-3 transition-[scale,background-color] duration-200 ease-[var(--ease-out-snap)] motion-safe:active:scale-[0.98]";

function MySoups() {
	const { scheda, pagina } = Route.useSearch();
	const page = pagina ?? 1;
	const favorites = scheda === "preferite";
	const { data: me } = useQuery(userQueries.viewer());
	const viewer = me?.viewer;
	const signedIn = Boolean(viewer && !viewer.isAnonymous);

	const tab = (active: boolean) =>
		cn(
			"text-body flex min-h-11 items-center justify-center gap-1.5 rounded-full px-4 font-medium no-underline transition-[background-color,color] duration-200",
			active ? "bg-text text-ground" : "hover:bg-text/[0.06]"
		);

	return (
		<>
			<PageHead blob="pumpkin" title="Le tue zuppe" back="/profilo" barWidth="max-w-xl">
				<p>Quelle che hai votato e quelle col cuore.</p>
			</PageHead>
			<main className="mx-auto flex max-w-xl flex-col gap-6 px-4">
				<nav
					aria-label="Quali zuppe"
					className="bg-ground-raised grid grid-cols-2 gap-1 rounded-full p-1"
				>
					<Link
						to="/le-mie-zuppe"
						search={{ scheda: undefined }}
						activeOptions={EXACT_SEARCH}
						aria-current={!favorites ? "page" : undefined}
						className={tab(!favorites)}
					>
						Votate
						{viewer && (
							<span className="tabular-nums opacity-70">{viewer.votesCount}</span>
						)}
					</Link>
					<Link
						to="/le-mie-zuppe"
						search={{ scheda: "preferite" }}
						activeOptions={EXACT_SEARCH}
						aria-current={favorites ? "page" : undefined}
						className={tab(favorites)}
					>
						Preferite
						{signedIn && viewer && (
							<span className="tabular-nums opacity-70">{viewer.favoritesCount}</span>
						)}
					</Link>
				</nav>

				{favorites ? (
					signedIn ? (
						<FavoritesList page={page} />
					) : (
						<Empty
							title="I preferiti stanno nel tuo account."
							body="Accedi con Google per tenere il cuore sulle zuppe che vuoi ritrovare, su ogni telefono e computer."
							action={{ to: "/accedi", label: "Accedi con Google" }}
						/>
					)
				) : (
					<VotesList page={page} anonymous={!signedIn} />
				)}
			</main>
		</>
	);
}

function VotesList({ page, anonymous }: { page: number; anonymous: boolean }) {
	const { data: votes, isPlaceholderData } = useQuery(userQueries.myVotes(page));
	// undefined is still on its way; null is a visitor with no session yet, who never voted.
	if (votes === undefined) return null;
	if (votes === null || votes.total === 0)
		return (
			<Empty
				title="Non hai ancora votato nessuna zuppa."
				body="Qui trovi ogni zuppa che voti, con le tue stelle e le tue due parole."
				action={{ to: "/", label: "Vota la prima zuppa" }}
			/>
		);

	return (
		<>
			{anonymous && (
				<p className="bg-field on-field text-body rounded-card p-5">
					Questi voti sono legati a questo browser.{" "}
					<Link to="/accedi" className="font-semibold underline">
						Accedi con Google
					</Link>{" "}
					per ritrovarli su ogni telefono e computer.
				</p>
			)}
			<ol
				className={cn("stagger flex flex-col gap-2", isPlaceholderData && "opacity-60")}
			>
				{votes.items.map(vote => (
					<li key={vote.productId}>
						<VoteRow vote={vote} />
					</li>
				))}
			</ol>
			<Link to="/" className={cn(buttonClass(), "self-start")}>
				Vota un’altra zuppa
				<ArrowRightIcon className="size-5" />
			</Link>
			<Pages page={page} pageCount={votes.pageCount} favorites={false} />
		</>
	);
}

function VoteRow({ vote }: { vote: MyVote }) {
	return (
		<article className={rowCard}>
			<Thumb src={vote.imageUrl} />
			<div className="flex min-w-0 flex-col gap-0.5">
				<SoupLink
					ean={vote.ean}
					className="font-display text-body font-medium no-underline group-hover:underline after:absolute after:inset-0 after:rounded-[1.5rem]"
				>
					{vote.name}
				</SoupLink>
				<p className="text-small text-text-soft">
					{[vote.brand, `votata il ${date.format(new Date(vote.votedAt))}`]
						.filter(Boolean)
						.join(" • ")}
				</p>
				{vote.tags.length > 0 && (
					<p className="text-small flex flex-wrap gap-x-3">
						{vote.tags.map(tag => (
							<span key={tag.label}>
								<span aria-hidden className="font-semibold">
									{SIGN[tag.sentiment]}
								</span>{" "}
								{tag.label}
							</span>
						))}
					</p>
				)}
			</div>
			<p className="flex flex-col items-end gap-0.5">
				<span className="bg-ink text-on-ink text-small inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-semibold tabular-nums">
					<StarIcon className="text-star size-3.5" />
					{vote.score}
					<span className="sr-only">{vote.score === 1 ? " stella" : " stelle"}</span>
				</span>
				<span className="text-small text-text-soft">
					{SCORE_LABELS[vote.score].label}
				</span>
			</p>
		</article>
	);
}

function FavoritesList({ page }: { page: number }) {
	const { data, isPlaceholderData } = useQuery(favoriteQueries.page(page));
	const list = useRef<HTMLOListElement>(null);
	const count = data?.items.length ?? 0;
	const previous = useRef(count);
	// Taking a heart off removes its row, and with it the button that had the focus: the focus
	// goes to the list, so the keyboard and the screen reader stay where they were.
	useEffect(() => {
		if (count < previous.current && document.activeElement === document.body)
			list.current?.focus();
		previous.current = count;
	}, [count]);
	if (!data) return null;
	if (data.total === 0)
		return (
			<Empty
				title="Ancora nessun preferito."
				body="Tocca il cuore su una zuppa, nel suo foglio o sulla foto in elenco, e la ritrovi qui."
				action={{ to: "/", label: "Sfoglia le zuppe" }}
			/>
		);

	return (
		<>
			<ol
				ref={list}
				tabIndex={-1}
				aria-label="Le tue preferite"
				className={cn(
					"stagger flex flex-col gap-2 outline-none",
					isPlaceholderData && "opacity-60"
				)}
			>
				{data.items.map(product => (
					<li key={product.id}>
						<FavoriteRow product={product} />
					</li>
				))}
			</ol>
			<Pages page={page} pageCount={data.pageCount} favorites />
		</>
	);
}

function FavoriteRow({ product }: { product: ProductListItem }) {
	const missing = MIN_VOTES_TO_RANK - product.votesCount;
	return (
		<article className={rowCard}>
			<Thumb src={product.imageUrl} />
			<div className="flex min-w-0 flex-col gap-1">
				<SoupLink
					ean={product.ean}
					className="font-display text-body font-medium no-underline group-hover:underline after:absolute after:inset-0 after:rounded-[1.5rem]"
				>
					{product.name}
				</SoupLink>
				<p className="text-small text-text-soft">{productDetails(product)}</p>
				<p className="flex flex-wrap items-center gap-1.5">
					{missing > 0 ? (
						<span className="text-small bg-field text-on-field rounded-full px-2 py-0.5 font-medium">
							{missing === 1 ? "Manca 1 voto" : `Mancano ${missing} voti`}
						</span>
					) : (
						<RatingBadge
							mean={product.mean}
							votesCount={product.votesCount}
							size="sm"
						/>
					)}
					{product.myScore && (
						<span className="bg-ink text-on-ink text-small inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold tabular-nums">
							<StarIcon className="text-star size-3" />
							{product.myScore}
							<span className="sr-only"> stelle, il tuo voto</span>
						</span>
					)}
				</p>
			</div>
			{/* Above the stretched link: taking the heart off is its own button, undone by its toast. */}
			<HeartButton
				productId={product.id}
				name={product.name}
				className="relative z-20"
			/>
		</article>
	);
}

function Thumb({ src }: { src: string | null }) {
	return src ? (
		<img
			src={sizedImage(src, 100) ?? src}
			alt=""
			loading="lazy"
			decoding="async"
			className="size-16 rounded-[1rem] bg-white object-cover"
		/>
	) : (
		<span aria-hidden className="bg-ground size-16 rounded-[1rem]" />
	);
}

function Empty({
	title,
	body,
	action,
}: {
	title: string;
	body: string;
	action: { to: "/" | "/accedi"; label: string };
}) {
	return (
		<div className="bg-ground-raised rounded-card flex flex-col items-start gap-3 p-6">
			<p className="text-body font-semibold">{title}</p>
			<p className="text-body">{body}</p>
			<Link to={action.to} className={buttonClass("ink")}>
				{action.label}
				<ArrowRightIcon className="size-5" />
			</Link>
		</div>
	);
}

function Pages({
	page,
	pageCount,
	favorites,
}: {
	page: number;
	pageCount: number;
	favorites: boolean;
}) {
	if (pageCount <= 1) return null;
	const scheda = favorites ? ("preferite" as const) : undefined;
	const link = "text-body min-h-11 content-center font-medium underline";
	return (
		<nav aria-label="Pagine" className="flex items-center justify-between gap-3">
			{page > 1 ? (
				<Link
					to="/le-mie-zuppe"
					search={{ scheda, pagina: page - 1 === 1 ? undefined : page - 1 }}
					className={link}
				>
					‹ Indietro
				</Link>
			) : (
				<span />
			)}
			<p className="text-small text-text-soft tabular-nums">
				Pagina {page} di {pageCount}
			</p>
			{page < pageCount ? (
				<Link to="/le-mie-zuppe" search={{ scheda, pagina: page + 1 }} className={link}>
					Avanti ›
				</Link>
			) : (
				<span />
			)}
		</nav>
	);
}
