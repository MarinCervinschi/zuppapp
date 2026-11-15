import { createFileRoute } from "@tanstack/react-router";

import { siteUrl } from "@/lib/seo/api/site";
import { getSitemap } from "@/lib/seo/sitemap";
import { log } from "@/lib/server/log";

// Built from the database at each request, like the catalogue dump: a few hundred soups.
export const Route = createFileRoute("/sitemap.xml")({
	server: {
		handlers: {
			GET: async () => {
				const site = siteUrl();
				try {
					if (!site) throw new Error("BETTER_AUTH_URL is not set");
					return new Response(await getSitemap(site), {
						headers: {
							"content-type": "application/xml; charset=utf-8",
							"cache-control": "public, max-age=3600",
						},
					});
				} catch (error) {
					log.error("Sitemap failed", {}, error);
					return new Response("", {
						status: 503,
						headers: { "cache-control": "no-store" },
					});
				}
			},
		},
	},
});
