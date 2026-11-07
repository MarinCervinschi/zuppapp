import { createFileRoute, redirect } from "@tanstack/react-router";

import { favoritesPageSchema } from "@/lib/favorites/schemas";

// The hearts now live in «Le tue zuppe», as its second tab; the old address still leads there.
export const Route = createFileRoute("/preferiti")({
	validateSearch: favoritesPageSchema,
	beforeLoad: ({ search }) => {
		throw redirect({
			to: "/le-mie-zuppe",
			search: { scheda: "preferite", pagina: search.pagina },
			statusCode: 301,
		});
	},
});
