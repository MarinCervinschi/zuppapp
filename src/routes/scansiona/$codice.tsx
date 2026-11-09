import { createFileRoute, notFound, redirect } from "@tanstack/react-router";

import { NotFoundPage } from "@/components/error/error-pages";
import { soupSheetState } from "@/components/product/soup-sheet";
import { ScanPage } from "@/components/scan/scan-page";
import { ScanResult } from "@/components/scan/scan-result";
import { track } from "@/lib/analytics/track";
import { catalogQueries } from "@/lib/catalog/queries";

// What a code turned out to be. A product we have opens its sheet over the camera straight away,
// replacing this URL, so closing the sheet returns to the camera. Loaded cold from its URL, there
// is no camera to go back to: the product's page opens instead.

export const Route = createFileRoute("/scansiona/$codice")({
	loader: async ({ context, params, preload }) => {
		if (!/^\d{8,14}$/.test(params.codice)) throw notFound();
		const result = await context.queryClient.ensureQueryData(
			catalogQueries.lookup(params.codice)
		);
		// Counted in the browser, when the scanner lands here; a page loaded straight from its URL
		// ran this on the server and counts nothing.
		if (!preload)
			track("scansione", {
				esito: result.kind === "coming" && result.imported ? "importato" : result.kind,
			});
		if (result.kind !== "found") return;
		if (typeof window === "undefined")
			throw redirect({
				to: "/prodotti/$ean",
				params: { ean: result.ean },
				replace: true,
			});
		throw redirect({
			to: "/scansiona",
			// A preload only looks ahead: the sheet isn't open yet.
			state: preload ? { zuppa: result.ean } : soupSheetState(result.ean),
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
