import { useEffect, useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import {
	ActiveFilters,
	FilterPanel,
	activeFilterCount,
} from "@/components/catalog/filters";
import { Pagination } from "@/components/catalog/pagination";
import { SearchBox } from "@/components/catalog/search-box";
import { TasteTile } from "@/components/catalog/taste-tile";
import { TypeRail } from "@/components/catalog/type-rail";
import { buttonClass } from "@/components/ds/button";
import { SettingsIcon } from "@/components/ds/icons";
import { PageHead } from "@/components/ds/page-head";
import { Sheet } from "@/components/ds/sheet";
import { track } from "@/lib/analytics/track";
import { zuppe } from "@/lib/catalog/labels";
import { catalogQueries } from "@/lib/catalog/queries";
import {
	type BrowseParams,
	EXACT_SEARCH,
	TILE_PAGE_SIZES,
	browseSchema,
} from "@/lib/catalog/schemas";
import type { Facets } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

// «Zuppe», the first tab: a search first. With text, a filter or «Vedi tutte» it lists the
// catalogue; before any of those it offers the soups still waiting for votes.

export const Route = createFileRoute("/")({
	validateSearch: browseSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context: { queryClient }, deps }) => {
		const { pagina, posti: _posti, mostra, righe: _righe, ...filters } = deps;
		const paging = { page: pagina ?? 1, size: mostra };
		await Promise.all([
			queryClient.ensureQueryData(catalogQueries.facets(filters)),
			isBrowsing(deps)
				? queryClient.ensureQueryData(catalogQueries.search(filters, paging))
				: queryClient.ensureQueryData(catalogQueries.toTaste(filters, paging)),
		]);
	},
	component: Home,
});

const tab = (active: boolean) =>
	cn(
		"text-body flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 font-medium whitespace-nowrap no-underline transition-[background-color,color] duration-200 max-[359px]:px-3 max-[359px]:text-[0.9375rem]",
		active ? "bg-text text-ground" : "hover:bg-text/[0.06]"
	);

function isBrowsing(params: BrowseParams) {
	return Boolean(params.q || params.vedi || activeFilterCount(params) > 0);
}

function Home() {
	const params = Route.useSearch();
	const { pagina, posti: _posti, mostra, righe: _righe, ...filters } = params;
	const { data: facets } = useQuery(catalogQueries.facets(filters));
	const browsing = isBrowsing(params);
	// The filters behind the button and in the column: the type has its own discs in sight.
	const otherFilters = activeFilterCount({ ...params, tipo: undefined });
	const [filtering, setFiltering] = useState(false);

	return (
		<>
			<PageHead blob="corn" shape="onda" title="Che zuppa stai cercando?" />

			{/* Positioned, so its focus rim paints over the header it touches, not under it. On a phone the
			    filters open from the button beside the field; on a wide screen they stand in a column. */}
			<div className="relative mx-auto flex max-w-xl items-center gap-2 px-4">
				{/* On a phone the suggestions cover the filters button too (3.5rem and the 0.5rem gap):
				    the whole row, with nothing of the page peeking out beside them. */}
				<SearchBox value={params.q ?? ""} listClassName="max-lg:-right-16" />
				<button
					type="button"
					onClick={() => setFiltering(true)}
					className="bg-ground-raised float-shadow relative grid size-14 shrink-0 place-items-center rounded-full transition-[scale] duration-150 motion-safe:active:scale-[0.94] lg:hidden"
				>
					<SettingsIcon className="size-6" />
					<span className="sr-only">Filtri</span>
					{otherFilters > 0 && (
						<span className="bg-field text-on-field text-small absolute -top-1 -right-1 grid min-w-6 place-items-center rounded-full px-1.5 font-semibold tabular-nums">
							{otherFilters}
							<span className="sr-only"> attivi</span>
						</span>
					)}
				</button>
			</div>
			{filtering && facets && (
				<FilterSheet
					params={params}
					facets={facets}
					onClosed={() => setFiltering(false)}
				/>
			)}

			{facets && (
				<div className="mx-auto max-w-6xl px-4 pt-6">
					<TypeRail
						route="/"
						current={params.tipo}
						subtypes={facets.subtypes}
						total={facets.anyType}
						className="lg:[&_ul]:justify-center"
					/>
				</div>
			)}

			<div className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
				{facets && (
					<aside
						aria-labelledby="filters-heading"
						className="hidden self-start lg:sticky lg:top-6 lg:flex lg:flex-col lg:gap-6"
					>
						<FiltersHeader params={params} />
						<FilterPanel params={params} facets={facets} />
					</aside>
				)}
				<main className="flex min-w-0 flex-col gap-6">
					{/* Before any text or filter: the soups still to taste, or the whole shelf. Two tabs
					    say which is showing; with a search the list is its results and they step aside. */}
					{!params.q && activeFilterCount(params) === 0 && (
						<nav
							aria-label="Quali zuppe"
							className="bg-ground-raised grid grid-cols-2 gap-1 self-center rounded-full p-1 lg:self-start"
						>
							<Link
								to="/"
								search={{ vedi: undefined }}
								activeOptions={EXACT_SEARCH}
								resetScroll={false}
								aria-current={!params.vedi ? "page" : undefined}
								className={tab(!params.vedi)}
							>
								Da assaggiare
							</Link>
							<Link
								to="/"
								search={{ vedi: "tutte" }}
								activeOptions={EXACT_SEARCH}
								resetScroll={false}
								aria-current={params.vedi ? "page" : undefined}
								className={tab(Boolean(params.vedi))}
							>
								{/* Not «Tutte»: that is the first disc above, all the types. */}
								Tutte le zuppe
							</Link>
						</nav>
					)}
					<ActiveFilters params={params} />
					{browsing ? (
						<Results params={params} page={pagina ?? 1} size={mostra} />
					) : (
						<ToTaste params={params} page={pagina ?? 1} size={mostra} />
					)}
				</main>
			</div>
		</>
	);
}

/** «Filtri» and, when something is filtered, the way to take it all off. */
function FiltersHeader({ params }: { params: BrowseParams }) {
	return (
		<div className="flex items-center justify-between gap-3">
			<h2 id="filters-heading" className="font-display text-title font-semibold">
				Filtri
			</h2>
			<ResetFilters params={params} />
		</div>
	);
}

/** Takes every filter off, keeping the text, the type and the tab; only when one is on. */
function ResetFilters({ params }: { params: BrowseParams }) {
	if (activeFilterCount({ ...params, tipo: undefined }) === 0) return null;
	return (
		<Link
			to="/"
			search={{ q: params.q, tipo: params.tipo, vedi: params.vedi }}
			resetScroll={false}
			className="text-body min-h-11 content-center px-2 font-medium underline"
		>
			Azzera
		</Link>
	);
}

/**
 * The filters on a phone: a sheet from the button beside the search. Each option is a link, so the
 * list behind changes at once; «Vedi» closes the sheet on it.
 */
function FilterSheet({
	params,
	facets,
	onClosed,
}: {
	params: BrowseParams;
	facets: Facets;
	onClosed: () => void;
}) {
	return (
		<Sheet
			title="Filtri"
			actions={<ResetFilters params={params} />}
			onClosed={onClosed}
		>
			{close => (
				<div className="flex flex-col gap-6">
					<FilterPanel params={params} facets={facets} />
					<button
						type="button"
						onClick={close}
						className={cn(buttonClass("ink"), "sticky bottom-0 w-full")}
					>
						{facets.total === 0
							? "Nessuna zuppa: togli un filtro"
							: `Vedi ${zuppe(facets.total)}`}
					</button>
				</div>
			)}
		</Sheet>
	);
}

type ListProps = { params: BrowseParams; page: number; size?: number };

function Results({ params, page, size }: ListProps) {
	const {
		pagina: _page,
		posti: _posti,
		mostra: _mostra,
		righe: _righe,
		...filters
	} = params;
	const { data, isFetching } = useQuery(catalogQueries.search(filters, { page, size }));

	// A search that finds nothing, counted once the reader stops typing: not the words, which
	// could be anything, only that it happened.
	const empty = Boolean(params.q) && data?.total === 0;
	const filterCount = activeFilterCount(params);
	useEffect(() => {
		if (!empty) return;
		const timer = setTimeout(
			() => track("ricerca_vuota", { filtri: filterCount }),
			2000
		);
		return () => clearTimeout(timer);
	}, [empty, params.q, filterCount]);

	if (!data) return null;

	const heading = params.q
		? `${data.total === 0 ? "Nessuna zuppa" : zuppe(data.total)} per «${params.q}»`
		: data.total === 0
			? "Nessuna zuppa con questi filtri"
			: zuppe(data.total);

	return (
		<section
			id="risultati"
			aria-labelledby="results-heading"
			aria-busy={isFetching}
			className="flex scroll-mt-6 flex-col gap-5"
		>
			{/* A live region, so a screen reader hears the count each time the text changes. */}
			<h2
				id="results-heading"
				role="status"
				className="font-display text-title font-semibold"
			>
				{heading}
			</h2>
			{data.total === 0 ? (
				<p className="text-body">
					Prova con un ingrediente («ceci»), un tipo («vellutata») o una marca. Se hai
					dei filtri attivi, prova a toglierli.
				</p>
			) : (
				<Grid items={data.items} dim={isFetching} />
			)}
			<Pagination
				page={page}
				pageCount={data.pageCount}
				pageSize={data.pageSize}
				total={data.total}
				sizes={TILE_PAGE_SIZES}
				param="pagina"
				sizeParam="mostra"
				unit="zuppe"
				section="risultati"
				label="Pagine dei risultati"
			/>
		</section>
	);
}

function ToTaste({ params, page, size }: ListProps) {
	const {
		pagina: _page,
		posti: _posti,
		mostra: _mostra,
		righe: _righe,
		...filters
	} = params;
	const { data, isPlaceholderData } = useQuery(
		catalogQueries.toTaste(filters, { page, size })
	);
	if (!data || data.total === 0) return null;

	return (
		<section
			id="da-assaggiare"
			aria-labelledby="taste-heading"
			className="flex scroll-mt-6 flex-col gap-5"
		>
			{/* The count is the title: the tab above already says which soups these are. */}
			<h2 id="taste-heading" className="font-display text-title font-semibold">
				{zuppe(data.total)}
			</h2>
			<Grid items={data.items} dim={isPlaceholderData} />
			<Pagination
				page={data.page}
				pageCount={data.pageCount}
				pageSize={data.pageSize}
				total={data.total}
				sizes={TILE_PAGE_SIZES}
				param="pagina"
				sizeParam="mostra"
				unit="zuppe"
				section="da-assaggiare"
				label="Pagine delle zuppe da assaggiare"
			/>
		</section>
	);
}

function Grid({
	items,
	dim,
}: {
	items: Parameters<typeof TasteTile>[0]["product"][];
	dim: boolean;
}) {
	return (
		<ul
			className={cn(
				"stagger grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-5",
				dim && "opacity-60"
			)}
		>
			{items.map(product => (
				<li key={product.id}>
					{/* Keyed by the reader's vote: when a fresh list brings a vote cast elsewhere, the tile starts from it. */}
					<TasteTile key={product.myScore ?? 0} product={product} />
				</li>
			))}
		</ul>
	);
}
