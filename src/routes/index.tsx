import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import {
	ActiveFilters,
	FilterPanel,
	FilterSheet,
	activeFilterCount,
} from "@/components/catalog/filters";
import { Pagination } from "@/components/catalog/pagination";
import { Leaderboard, Podium } from "@/components/catalog/ranking";
import { SearchBox } from "@/components/catalog/search-box";
import { TasteTile } from "@/components/catalog/taste-tile";
import { SpreadLegend } from "@/components/ds/score-spread";
import { UserChip } from "@/components/user/user-chip";
import { subtypeLabel, zuppe } from "@/lib/catalog/labels";
import { catalogQueries } from "@/lib/catalog/queries";
import {
	type BrowseParams,
	ROW_PAGE_SIZES,
	TILE_PAGE_SIZES,
	browseSchema,
} from "@/lib/catalog/schemas";
import { MIN_VOTES_TO_RANK } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
	validateSearch: browseSchema,
	loaderDeps: ({ search }) => search,
	loader: async ({ context: { queryClient }, deps }) => {
		const { pagina, posti, mostra, righe, ...filters } = deps;
		await Promise.all([
			queryClient.ensureQueryData(catalogQueries.facets(filters)),
			filters.q
				? queryClient.ensureQueryData(
						catalogQueries.search(filters, { page: pagina ?? 1, size: mostra })
					)
				: Promise.all([
						queryClient.ensureQueryData(
							catalogQueries.ranking(filters, { page: posti ?? 1, size: righe })
						),
						queryClient.ensureQueryData(
							catalogQueries.toTaste(filters, { page: pagina ?? 1, size: mostra })
						),
					]),
		]);
	},
	component: Home,
});

function Home() {
	const params = Route.useSearch();
	const { pagina, posti, mostra, righe, ...filters } = params;
	const { data: facets } = useQuery(catalogQueries.facets(filters));
	// Shares its cache with <Results>: here only to feed the status line below.
	const search = useQuery({
		...catalogQueries.search(filters, { page: pagina ?? 1, size: mostra }),
		enabled: Boolean(params.q),
	});
	const status =
		params.q && search.data
			? `${search.data.total === 0 ? "Nessuna zuppa" : zuppe(search.data.total)} per «${params.q}»`
			: "";

	return (
		<>
			<header className="bg-field on-field">
				<div className="mx-auto flex max-w-6xl justify-end px-4 pt-3">
					<UserChip />
				</div>
				<div className="mx-auto grid max-w-6xl gap-5 px-4 pt-2 pb-6 md:grid-cols-[auto_1fr] md:items-end md:gap-x-12 md:pt-4">
					<div className="flex flex-col gap-2">
						<h1 className="font-condensed text-wordmark font-black tracking-[-0.03em] uppercase">
							Zuppapp
						</h1>
						<p className="text-body max-w-[30ch] font-semibold">
							La classifica delle zuppe pronte, votata da chi le ha assaggiate.
						</p>
					</div>
					<SearchBox value={params.q ?? ""} />
				</div>
			</header>

			<div className="mx-auto grid max-w-6xl gap-10 px-4 pt-6 pb-16 lg:grid-cols-[16rem_1fr] lg:pt-10">
				{facets && (
					<aside
						aria-label="Filtri"
						className="hidden self-start lg:sticky lg:top-6 lg:block"
					>
						<FilterPanel params={params} facets={facets} />
					</aside>
				)}

				<main className="flex min-w-0 flex-col gap-10">
					{/* Always in the page, so a screen reader hears the results each time the text changes. */}
					<p role="status" className="sr-only">
						{status}
					</p>
					{facets && (
						<div className="flex flex-wrap items-center gap-3">
							<FilterSheet
								params={params}
								facets={facets}
								active={activeFilterCount(params)}
							/>
							<ActiveFilters params={params} />
						</div>
					)}
					{params.q ? (
						<Results params={params} page={pagina ?? 1} />
					) : (
						<Shelf
							filters={filters}
							ranking={{ page: posti ?? 1, size: righe }}
							shelf={{ page: pagina ?? 1, size: mostra }}
						/>
					)}
				</main>
			</div>
		</>
	);
}

type Paging = { page: number; size?: number };

function Shelf({
	filters,
	ranking: rankingPaging,
	shelf,
}: {
	filters: Omit<BrowseParams, "pagina" | "posti" | "mostra" | "righe">;
	ranking: Paging;
	shelf: Paging;
}) {
	const ranking = useQuery(catalogQueries.ranking(filters, rankingPaging));
	const toTaste = useQuery(catalogQueries.toTaste(filters, shelf));
	const scope = filters.tipo ? subtypeLabel(filters.tipo).toLowerCase() : "zuppe";
	const board = ranking.data;

	return (
		<>
			<section
				id="classifica"
				aria-labelledby="ranking-heading"
				className="flex scroll-mt-6 flex-col gap-5"
			>
				<div className="flex flex-col gap-3">
					<h2
						id="ranking-heading"
						className="font-condensed text-title font-black uppercase"
					>
						La classifica{filters.tipo && ` delle ${scope}`}
					</h2>
					{board && board.total > 0 && (
						<>
							<p className="text-body max-w-[60ch]">
								In ordine di quanti la ricomprerebbero, contando anche quanti l’hanno
								votata: il 60% su 5 voti vale meno del 50% su 18.
							</p>
							<SpreadLegend />
						</>
					)}
				</div>
				{!board || board.total === 0 ? (
					<p className="bg-ground-raised text-body p-5">
						Qui non c’è ancora nessuna classifica: una zuppa entra dal{" "}
						{MIN_VOTES_TO_RANK}° voto. Assaggia e vota quelle qui sotto.
					</p>
				) : (
					<>
						{/* Page 1 opens on the podium; the next pages are rows only. */}
						<Podium products={board.podium} />
						<div
							className={cn(
								"flex flex-col gap-4",
								ranking.isPlaceholderData && "opacity-60"
							)}
						>
							<Leaderboard products={board.rows} start={board.rows[0]?.rank ?? 1} />
							<Pagination
								page={board.page}
								pageCount={board.pageCount}
								pageSize={board.pageSize}
								total={board.total}
								sizes={ROW_PAGE_SIZES}
								param="posti"
								sizeParam="righe"
								unit="posti"
								section="classifica"
								label="Pagine della classifica"
							/>
						</div>
					</>
				)}
			</section>

			<section
				id="da-assaggiare"
				aria-labelledby="taste-heading"
				className="flex scroll-mt-6 flex-col gap-5"
			>
				<div className="flex flex-col gap-1">
					<h2
						id="taste-heading"
						className="font-condensed text-title font-black uppercase"
					>
						Da assaggiare
					</h2>
					<p className="text-body">
						{toTaste.data?.total
							? `${zuppe(toTaste.data.total)} aspettano ancora i voti per entrare in classifica.`
							: "Tutte le zuppe qui sono già in classifica."}
					</p>
				</div>
				<ul
					className={cn(
						"grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4",
						toTaste.isPlaceholderData && "opacity-60"
					)}
				>
					{toTaste.data?.items.map(product => (
						<li key={product.id}>
							<TasteTile product={product} />
						</li>
					))}
				</ul>
				{toTaste.data && (
					<Pagination
						page={toTaste.data.page}
						pageCount={toTaste.data.pageCount}
						pageSize={toTaste.data.pageSize}
						total={toTaste.data.total}
						sizes={TILE_PAGE_SIZES}
						param="pagina"
						sizeParam="mostra"
						unit="zuppe"
						section="da-assaggiare"
						label="Pagine delle zuppe da assaggiare"
					/>
				)}
			</section>
		</>
	);
}

function Results({ params, page }: { params: BrowseParams; page: number }) {
	const { pagina: _page, posti: _posti, mostra, righe: _righe, ...filters } = params;
	const { data, isFetching } = useQuery(
		catalogQueries.search(filters, { page, size: mostra })
	);
	if (!data) return null;

	return (
		<section
			id="risultati"
			aria-labelledby="results-heading"
			aria-busy={isFetching}
			className="flex scroll-mt-6 flex-col gap-5"
		>
			<h2
				id="results-heading"
				className="font-condensed text-title font-black uppercase"
			>
				{data.total === 0 ? "Nessuna zuppa" : zuppe(data.total)} per «{params.q}»
			</h2>
			{data.total === 0 ? (
				<p className="text-body">
					Prova con un ingrediente («ceci»), un tipo («vellutata») o una marca. Se hai
					dei filtri attivi, prova a toglierli.
				</p>
			) : (
				<ul
					className={cn(
						"grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4",
						isFetching && "opacity-60"
					)}
				>
					{data.items.map(product => (
						<li key={product.id}>
							<TasteTile product={product} />
						</li>
					))}
				</ul>
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
