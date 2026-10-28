import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import {
	facetsFn,
	getProductCardFn,
	lookupEanFn,
	rankingFn,
	searchFn,
	toTasteFn,
} from "./api";
import type { BrowseParams } from "./schemas";

// Filters without the page numbers: each list adds only its own page to its key.
type Filters = Omit<BrowseParams, "pagina" | "posti" | "mostra" | "righe">;
type Paging = { page: number; size?: number };

export const catalogQueries = {
	/** A scanned or typed code: may import the product from Open Food Facts, so fetched once. */
	lookup: (ean: string) =>
		queryOptions({
			queryKey: ["catalog", "lookup", ean],
			queryFn: () => lookupEanFn({ data: { ean } }),
			staleTime: Infinity,
		}),
	card: (ean: string) =>
		queryOptions({
			queryKey: ["catalog", "card", ean],
			queryFn: () => getProductCardFn({ data: { ean } }),
		}),
	ranking: (filters: Filters, { page, size }: Paging) =>
		queryOptions({
			queryKey: ["catalog", "ranking", filters, page, size],
			queryFn: () => rankingFn({ data: { ...filters, posti: page, righe: size } }),
			placeholderData: keepPreviousData,
		}),
	facets: (filters: Filters) =>
		queryOptions({
			queryKey: ["catalog", "facets", filters],
			queryFn: () => facetsFn({ data: filters }),
			placeholderData: keepPreviousData,
		}),
	toTaste: (filters: Filters, { page, size }: Paging) =>
		queryOptions({
			queryKey: ["catalog", "to-taste", filters, page, size],
			queryFn: () => toTasteFn({ data: { ...filters, pagina: page, mostra: size } }),
			placeholderData: keepPreviousData,
		}),
	search: (filters: Filters, { page, size }: Paging) =>
		queryOptions({
			queryKey: ["catalog", "search", filters, page, size],
			queryFn: () => searchFn({ data: { ...filters, pagina: page, mostra: size } }),
			placeholderData: keepPreviousData,
		}),
};
