import { createFileRoute, redirect } from "@tanstack/react-router";

import { browseSchema } from "@/lib/catalog/schemas";

// The advanced search is now the filters of the home (a column on a wide screen, a sheet from the
// button beside the search on a phone): the old address carries its choices there.
export const Route = createFileRoute("/cerca")({
	validateSearch: browseSchema,
	beforeLoad: ({ search }) => {
		throw redirect({ to: "/", search, hash: "risultati", statusCode: 301 });
	},
});
