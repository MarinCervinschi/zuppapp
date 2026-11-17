import { createFileRoute } from "@tanstack/react-router";

import { siteUrl } from "@/lib/seo/api/site";
import { getLlmsTxt } from "@/lib/seo/llms";
import { log } from "@/lib/server/log";

// What Zuppapp is, for a language model; the content is in `src/lib/seo/llms.ts`.
export const Route = createFileRoute("/llms.txt")({
	server: {
		handlers: {
			GET: async () => {
				const site = siteUrl();
				try {
					if (!site) throw new Error("BETTER_AUTH_URL is not set");
					return new Response(await getLlmsTxt(site), {
						headers: {
							"content-type": "text/markdown; charset=utf-8",
							"cache-control": "public, max-age=3600",
						},
					});
				} catch (error) {
					log.error("llms.txt failed", {}, error);
					return new Response("", {
						status: 503,
						headers: { "cache-control": "no-store" },
					});
				}
			},
		},
	},
});
