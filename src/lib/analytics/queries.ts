import { queryOptions } from "@tanstack/react-query";

import { umamiFn } from "./api/umami";

export const analyticsQueries = {
	// Fixed for the life of the process: asked once, not on every navigation.
	umami: () =>
		queryOptions({
			queryKey: ["analytics", "umami"],
			queryFn: () => umamiFn(),
			staleTime: Infinity,
		}),
};
