import { queryOptions } from "@tanstack/react-query";

import { siteUrlFn } from "./api/site";

export const seoQueries = {
	// Fixed for the life of the process: asked once, not on every navigation.
	siteUrl: () =>
		queryOptions({
			queryKey: ["seo", "site-url"],
			queryFn: () => siteUrlFn(),
			staleTime: Infinity,
		}),
};
