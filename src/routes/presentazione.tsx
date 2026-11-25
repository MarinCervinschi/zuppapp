import { createFileRoute } from "@tanstack/react-router";

import { Landing } from "@/components/landing/landing";
import { catalogQueries } from "@/lib/catalog/queries";
import { ROW_PAGE_SIZES, TILE_PAGE_SIZES } from "@/lib/catalog/schemas";
import { landingData } from "@/lib/landing/facts";
import landingCss from "@/styles/landing.css?url";

// «Presentazione ufficiale»: the landing for whoever arrives for the first time. A short film
// driven by the scroll, told with the real catalogue: its size, a real label, the podium as it is
// today and the soup one vote away from it. No tab bar and no footer (`bare`, read by __root).

/** How many soups the loader tries before giving up on a real label. */
const LABEL_CANDIDATES = 6;

export const Route = createFileRoute("/presentazione")({
	staticData: { bare: true },
	loader: async ({ context: { queryClient } }) => {
		const [facets, ranking, toTaste] = await Promise.all([
			queryClient.ensureQueryData(catalogQueries.facets({})),
			queryClient.ensureQueryData(
				catalogQueries.ranking({}, { page: 1, size: ROW_PAGE_SIZES[0] })
			),
			queryClient.ensureQueryData(
				catalogQueries.toTaste({}, { page: 1, size: TILE_PAGE_SIZES[0] })
			),
		]);
		// The label the laser reads: the highest in the ranking whose label lists its ingredients,
		// or else one of the soups closest to it. A few cards at once, the first good one wins.
		const candidates = [...ranking.podium, ...ranking.rows, ...toTaste.items]
			.slice(0, LABEL_CANDIDATES)
			.map(p => p.ean);
		const cards = await Promise.all(
			candidates.map(ean =>
				queryClient.ensureQueryData(catalogQueries.card(ean)).catch(() => null)
			)
		);
		const card = cards.find(c => c?.ingredientsText?.trim()) ?? null;
		return landingData({ total: facets.total, ranking, toTaste: toTaste.items, card });
	},
	head: () => ({
		meta: [
			{ title: "Presentiamo la zuppa pronta · Zuppapp" },
			{
				name: "description",
				content:
					"Le zuppe pronte sono tante e nessuna ti dice se è buona. Su Zuppapp le votano le persone, con le stelle, anche senza account.",
			},
			{ property: "og:title", content: "Presentiamo la zuppa pronta" },
		],
		links: [{ rel: "stylesheet", href: landingCss }],
	}),
	component: Presentation,
});

function Presentation() {
	return <Landing data={Route.useLoaderData()} />;
}
