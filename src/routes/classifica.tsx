import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Pagination } from "@/components/catalog/pagination";
import { Leaderboard, Podium } from "@/components/catalog/ranking";
import { PageHead } from "@/components/ds/page-head";
import { pillClass } from "@/components/ds/pill";
import { subtypeLabel, zuppe } from "@/lib/catalog/labels";
import { catalogQueries } from "@/lib/catalog/queries";
import { EXACT_SEARCH, ROW_PAGE_SIZES, browseSchema } from "@/lib/catalog/schemas";
import { MIN_VOTES_TO_RANK, PRIOR_VOTES } from "@/lib/ranking/rules";
import { cn } from "@/lib/utils";

// «Classifica», the second tab: the soups with enough votes, by the Bayesian mean of their
// stars. Page 1 opens on the podium; «per pagina» counts places, podium included.

export const Route = createFileRoute("/classifica")({
	validateSearch: browseSchema,
	loaderDeps: ({ search }) => ({
		tipo: search.tipo,
		posti: search.posti,
		righe: search.righe,
	}),
	loader: async ({ context: { queryClient }, deps }) => {
		await Promise.all([
			queryClient.ensureQueryData(catalogQueries.facets({})),
			queryClient.ensureQueryData(
				catalogQueries.ranking(
					{ tipo: deps.tipo },
					{ page: deps.posti ?? 1, size: deps.righe }
				)
			),
		]);
	},
	head: () => ({ meta: [{ title: "Classifica · Zuppapp" }] }),
	component: Ranking,
});

function Ranking() {
	const { tipo, posti, righe } = Route.useSearch();
	const { data: facets } = useQuery(catalogQueries.facets({}));
	const { data: board, isPlaceholderData } = useQuery(
		catalogQueries.ranking({ tipo }, { page: posti ?? 1, size: righe })
	);
	const first = (posti ?? 1) === 1;
	const top = board ? Math.min(board.pageSize, board.total) : 0;

	return (
		<>
			<PageHead
				blob="tomato"
				shape="onda"
				title={first && top > 3 ? `Top ${top} zuppe` : "La classifica"}
			>
				<p>
					{board && board.total > 0
						? `Le ${zuppe(board.total)}${tipo ? ` (${subtypeLabel(tipo).toLowerCase()})` : ""} votate da almeno ${MIN_VOTES_TO_RANK} persone, dalla più amata.`
						: "Le zuppe più amate, votate da chi le ha assaggiate."}
				</p>
			</PageHead>

			<main className="mx-auto flex max-w-4xl flex-col gap-8 px-4">
				{facets && facets.subtypes.length > 1 && (
					<nav aria-label="Tipo di zuppa" className="flex justify-center">
						<ul className="flex flex-wrap justify-center gap-2">
							{[
								{ value: undefined, label: "Tutte" },
								...facets.subtypes.map(f => ({
									value: f.value,
									label: subtypeLabel(f.value),
								})),
							].map(option => {
								const active = tipo === option.value;
								return (
									<li key={option.label}>
										<Link
											to="/classifica"
											activeOptions={EXACT_SEARCH}
											search={{ tipo: option.value }}
											aria-current={active ? "true" : undefined}
											className={pillClass(active)}
										>
											{option.label}
										</Link>
									</li>
								);
							})}
						</ul>
					</nav>
				)}

				{!board || board.total === 0 ? (
					<p className="bg-ground-raised text-body rounded-card p-6">
						Qui non c’è ancora nessuna classifica: una zuppa entra dal{" "}
						{MIN_VOTES_TO_RANK}° voto.{" "}
						<Link to="/" className="underline">
							Assaggia e vota le zuppe
						</Link>
						.
					</p>
				) : (
					<section
						id="classifica"
						aria-label="Classifica"
						className={cn(
							"flex scroll-mt-6 flex-col gap-8",
							isPlaceholderData && "opacity-60"
						)}
					>
						<Podium products={board.podium} />
						<Leaderboard products={board.rows} start={board.rows[0]?.rank ?? 1} />
						<p className="text-small text-text-soft">
							Conta la media delle stelle e quante persone l’hanno votata: ogni zuppa
							parte con {PRIOR_VOTES} voti nella media di tutte, così un 5 da due voti
							non supera un 4,7 da quaranta.
						</p>
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
							route="/classifica"
						/>
					</section>
				)}
			</main>
		</>
	);
}
