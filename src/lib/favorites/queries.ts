import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { favoriteIdsFn, myFavoritesFn } from "./api";

export const favoriteQueries = {
	/** Every heart the reader has, as product ids: one small list behind all the hearts on screen. */
	ids: () =>
		queryOptions({
			queryKey: ["viewer", "favorites", "ids"],
			queryFn: () => favoriteIdsFn(),
			staleTime: 60_000,
		}),
	page: (page: number) =>
		queryOptions({
			queryKey: ["viewer", "favorites", "page", page],
			queryFn: () => myFavoritesFn({ data: { pagina: page } }),
			placeholderData: keepPreviousData,
		}),
};
