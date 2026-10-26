import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { myVotesFn, viewerFn } from "./api";

export const userQueries = {
	viewer: () =>
		queryOptions({
			queryKey: ["viewer"],
			queryFn: () => viewerFn(),
			staleTime: 60_000,
		}),
	myVotes: (page: number) =>
		queryOptions({
			queryKey: ["viewer", "votes", page],
			queryFn: () => myVotesFn({ data: { pagina: page } }),
			placeholderData: keepPreviousData,
		}),
};
