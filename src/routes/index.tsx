import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import {
	ActiveFilters,
	FilterPanel,
	FilterSheet,
	activeFilterCount,
} from "@/components/catalog/filters";
import { Pagination } from "@/components/catalog/pagination";
import { SearchBox } from "@/components/catalog/search-box";
import { TasteTile } from "@/components/catalog/taste-tile";
import { buttonClass } from "@/components/ds/button";
import { PageHead } from "@/components/ds/page-head";
import { zuppe } from "@/lib/catalog/labels";
import { catalogQueries } from "@/lib/catalog/queries";
import {
	type BrowseParams,
	EXACT_SEARCH,
	TILE_PAGE_SIZES,
	browseSchema,
} from "@/lib/catalog/schemas";
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

function isBrowsing(params: BrowseParams) {
	return Boolean(params.q || params.vedi || activeFilterCount(params) > 0);
}

/** «Più di 450 zuppe pronte»: a round figure reads better in a headline than 477. */
function catalogueSize(total: number) {
	return total >= 100 ? `Più di ${Math.floor(total / 50) * 50} zuppe` : zuppe(total);
}

function Home() {
	const params = Route.useSearch();
	const { pagina, posti: _posti, mostra, righe: _righe, ...filters } = params;
	const { data: facets } = useQuery(catalogQueries.facets(filters));
	const browsing = isBrowsing(params);

	return (
		<>
			<PageHead blob="corn" shape="onda" title="Che zuppa stai cercando?">
				{facets && (
					<p>{catalogueSize(facets.total)} pronte, votate da chi le ha assaggiate.</p>
				)}
			</PageHead>

			<div className="mx-auto max-w-xl px-4">
				<SearchBox value={params.q ?? ""} />
			</div>

			<div className="mx-auto grid max-w-6xl gap-10 px-4 pt-8 lg:grid-cols-[16rem_1fr]">
				{facets && (
					<aside
						aria-label="Filtri"
						className="hidden self-start lg:sticky lg:top-6 lg:block"
					>
						<FilterPanel params={params} facets={facets} />
					</aside>
				)}

				<main className="flex min-w-0 flex-col gap-8">
					{facets && (
						<div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
							<FilterSheet
								params={params}
								facets={facets}
								active={activeFilterCount(params)}
							/>
							{!browsing && (
								<Link
									to="/"
									activeOptions={EXACT_SEARCH}
									search={prev => ({ ...prev, vedi: "tutte" })}
									hash="risultati"
									className={buttonClass("ink")}
								>
									Vedi {zuppe(facets.total)}
								</Link>
							)}
							<ActiveFilters params={params} />
						</div>
					)}
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
			<div className="flex flex-col gap-1">
				<h2 id="taste-heading" className="font-display text-title font-semibold">
					Da assaggiare
				</h2>
				<p className="text-body text-text-soft">
					{zuppe(data.total)} aspettano ancora qualche voto per entrare in classifica.
				</p>
			</div>
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
				"grid grid-cols-1 gap-x-4 gap-y-10 sm:grid-cols-2 md:grid-cols-3 md:gap-x-5",
				dim && "opacity-60"
			)}
		>
			{items.map(product => (
				<li key={product.id}>
					<TasteTile product={product} />
				</li>
			))}
		</ul>
	);
}
