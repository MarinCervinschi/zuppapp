import { createFileRoute } from "@tanstack/react-router";

import { DUMP_FILE_NAME, getCatalogDump } from "@/lib/catalog/dump";
import { log } from "@/lib/server/log";

// The ODbL dump that `/dati` links to, built from the database at each request: the catalogue
// is a few hundred products, and a file kept in the repo would go stale at the first sync.
export const Route = createFileRoute("/dati_/catalogo.json")({
	server: {
		handlers: {
			GET: async () => {
				try {
					const dump = await getCatalogDump();
					return new Response(JSON.stringify(dump, null, "\t"), {
						headers: {
							"content-type": "application/json; charset=utf-8",
							"content-disposition": `attachment; filename="${DUMP_FILE_NAME}"`,
							"cache-control": "public, max-age=3600",
						},
					});
				} catch (error) {
					log.error("Catalogue dump failed", {}, error);
					return new Response("Il catalogo non è disponibile. Riprova tra poco.", {
						status: 503,
						headers: { "cache-control": "no-store" },
					});
				}
			},
		},
	},
});
