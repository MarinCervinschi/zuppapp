import { createFileRoute } from "@tanstack/react-router";

import { siteUrl } from "@/lib/seo/api/site";

// Everything can be crawled but the API: private pages say noindex themselves, which a crawler only
// reads if it is let in.
export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () => {
				const site = siteUrl();
				const lines = ["User-agent: *", "Allow: /", "Disallow: /api/"];
				if (site) lines.push("", `Sitemap: ${site}/sitemap.xml`);
				return new Response(lines.join("\n") + "\n", {
					headers: {
						"content-type": "text/plain; charset=utf-8",
						"cache-control": "public, max-age=86400",
					},
				});
			},
		},
	},
});
