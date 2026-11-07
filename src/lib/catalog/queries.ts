import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import {
	facetsFn,
	getProductCardFn,
	lookupEanFn,
	rankingFn,
	searchFn,
	suggestFn,
	toTasteFn,
} from "./api";
import type { BrowseParams } from "./schemas";

// Filters without the page numbers: each list adds only its own page to its key.
export type Filters = Omit<BrowseParams, "pagina" | "posti" | "mostra" | "righe">;

/** The filters of an address, without its page numbers: the key every list's cache shares. */
export function listFilters(params: BrowseParams): Filters {
	const {
		pagina: _pagina,
		posti: _posti,
		mostra: _mostra,
		righe: _righe,
		...filters
	} = params;
	return filters;
}
type Paging = { page: number; size?: number };

/**
 * Every catalogue query that a vote or an admin change can make stale: all of them except the
 * scanner's lookup, which would ask Open Food Facts again.
 */
export const isRefreshableCatalogQuery = ({
	queryKey,
}: {
	queryKey: readonly unknown[];
}) => queryKey[0] === "catalog" && queryKey[1] !== "lookup";

export const catalogQueries = {
	/** A scanned or typed code: may import the product from Open Food Facts, so fetched once. */
	lookup: (ean: string) =>
		queryOptions({
			queryKey: ["catalog", "lookup", ean],
			queryFn: () => lookupEanFn({ data: { ean } }),
			staleTime: Infinity,
		}),
	/** The search box's suggestions: kept a minute, the previous ones shown while the next arrive. */
	suggest: (q: string) =>
		queryOptions({
			queryKey: ["catalog", "suggest", q],
			queryFn: () => suggestFn({ data: { q } }),
			placeholderData: keepPreviousData,
			enabled: q.trim().length >= 2,
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
