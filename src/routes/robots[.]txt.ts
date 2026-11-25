import { createFileRoute } from "@tanstack/react-router";

import { siteUrl } from "@/lib/seo/api/site";

// Everything can be crawled but the API and the filtered lists: private pages say noindex themselves,
// which a crawler only reads if it is let in. The filters combine into thousands of URLs that all
// point their canonical at the bare list, so a crawler would spend its visits there instead of on
// the soups.
export const Route = createFileRoute("/robots.txt")({
	server: {
		handlers: {
			GET: () => {
				const site = siteUrl();
				const lines = [
					"User-agent: *",
					"Allow: /",
					"Disallow: /api/",
					"Disallow: /?",
					"Disallow: /classifica?",
					"Disallow: /cerca",
				];
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
