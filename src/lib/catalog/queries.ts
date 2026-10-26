import { queryOptions } from "@tanstack/react-query";

import { getProductCardFn, listProductsFn } from "./api";

export const catalogQueries = {
	card: (ean: string) =>
		queryOptions({
			queryKey: ["catalog", "card", ean],
			queryFn: () => getProductCardFn({ data: { ean } }),
		}),
	list: () =>
		queryOptions({
			queryKey: ["catalog", "list"],
			queryFn: () => listProductsFn(),
		}),
};
