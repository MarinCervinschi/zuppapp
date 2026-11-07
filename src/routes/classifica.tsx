import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { Pagination } from "@/components/catalog/pagination";
import { Leaderboard, Podium } from "@/components/catalog/ranking";
import { TypeRail } from "@/components/catalog/type-rail";
import { buttonClass } from "@/components/ds/button";
import { InfoIcon } from "@/components/ds/icons";
import { PageHead } from "@/components/ds/page-head";
import { Sheet } from "@/components/ds/sheet";
import { catalogQueries } from "@/lib/catalog/queries";
import { ROW_PAGE_SIZES, browseSchema } from "@/lib/catalog/schemas";
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
	const [explaining, setExplaining] = useState(false);
	const top = board ? Math.min(board.pageSize, board.total) : 0;

	return (
		<>
			<PageHead
				blob="tomato"
				shape="onda"
				title={first && top > 3 ? `Top ${top} zuppe` : "La classifica"}
				action={
					<button
						type="button"
						onClick={() => setExplaining(true)}
						className="glass grid size-11 place-items-center rounded-full transition-[scale] duration-150 ease-out motion-safe:active:scale-[0.94]"
					>
						<InfoIcon className="size-6" />
						<span className="sr-only">Come si ordina la classifica</span>
					</button>
				}
			/>
			{explaining && <HowItWorks onClosed={() => setExplaining(false)} />}

			<main className="mx-auto flex max-w-5xl flex-col gap-8 px-4">
				{facets && facets.subtypes.length > 1 && (
					<TypeRail
						route="/classifica"
						current={tipo}
						subtypes={facets.subtypes}
						className="[&_ul]:justify-start lg:[&_ul]:justify-center"
					/>
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

/** «Come si ordina»: the ranking's rule in three lines, in a sheet instead of under the list. */
function HowItWorks({ onClosed }: { onClosed: () => void }) {
	return (
		<Sheet title="Come si ordina" onClosed={onClosed} wide="popup">
			{close => (
				<div className="flex flex-col gap-5">
					<ol className="flex flex-col gap-4">
						{[
							[
								"Conta la media e quanti l’hanno votata.",
								`Ogni zuppa parte con ${PRIOR_VOTES} voti nella media di tutte: così un 5 da due voti non supera un 4,7 da quaranta.`,
							],
							[
								`Si entra dal ${MIN_VOTES_TO_RANK}° voto.`,
								"Prima la zuppa è «da assaggiare»: la trovi nelle Zuppe, e il tuo voto può farla entrare.",
							],
							[
								"Il bollino verde è la media semplice.",
								"Le stelle che le hanno dato, divise per i voti: quella che leggi su ogni card.",
							],
						].map(([title, body], index) => (
							<li key={title} className="flex gap-3">
								<span className="bg-soup-corn font-display text-body grid size-9 shrink-0 place-items-center rounded-full font-semibold text-[#16120f]">
									{index + 1}
								</span>
								<p className="text-body flex flex-col gap-0.5">
									<span className="font-semibold">{title}</span>
									<span className="text-text-soft">{body}</span>
								</p>
							</li>
						))}
					</ol>
					<Link to="/" onClick={close} className={cn(buttonClass("ink"), "w-full")}>
						Vota le zuppe da assaggiare
					</Link>
				</div>
			)}
		</Sheet>
	);
}
