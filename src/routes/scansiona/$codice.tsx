import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { NotFoundPage } from "@/components/error/error-pages";
import { ScanPage } from "@/components/scan/scan-page";
import { ScanResult } from "@/components/scan/scan-result";
import { catalogQueries } from "@/lib/catalog/queries";

// What a code turned out to be. A product we have opens its page straight away, replacing this
// URL, so the back button from the page returns to the camera.

export const Route = createFileRoute("/scansiona/$codice")({
	loader: async ({ context, params }) => {
		if (!/^\d{8,14}$/.test(params.codice)) throw notFound();
		const result = await context.queryClient.ensureQueryData(
			catalogQueries.lookup(params.codice)
		);
		if (result.kind === "found")
			throw redirect({
				to: "/prodotti/$ean",
				params: { ean: result.ean },
				replace: true,
			});
	},
	head: () => ({ meta: [{ title: "Scansiona · Zuppapp" }] }),
	pendingComponent: () => (
		<ScanPage>
			<p role="status" className="text-body text-center">
				Cerco la zuppa…
			</p>
		</ScanPage>
	),
	notFoundComponent: NotFoundPage,
	component: Result,
});

function Result() {
	const { codice } = Route.useParams();
	return (
		<ScanPage>
			<ScanResult ean={codice} />
		</ScanPage>
	);
}
