import { z } from "zod";

// EAN-8, UPC-A, EAN-13 and GTIN-14: digits only.
export const eanSchema = z.object({
	ean: z.string().regex(/^\d{8,14}$/, "Il codice EAN ha da 8 a 14 cifre."),
});

/** What the search box sends while you type: two letters at least, so «m» is not a query. */
export const suggestSchema = z.object({ q: z.string().trim().min(2).max(60) });

export const NUTRISCORES = ["a", "b", "c", "d", "e"] as const;

/** The allergens a soup pack most often declares, by the name the import stores. */
export const ALLERGEN_FILTERS = [
	"glutine",
	"latte",
	"sedano",
	"soia",
	"uova",
	"frutta a guscio",
] as const;

// Lists travel in the URL as "a,b": short, readable, and the same on every browser.
const csv = <T extends string>(allowed: readonly T[]) =>
	z
		.string()
		.optional()
		.transform(value =>
			(value ?? "")
				.split(",")
				.map(item => item.trim())
				.filter((item): item is T => (allowed as readonly string[]).includes(item))
		)
		.transform(list => (list.length > 0 ? list.join(",") : undefined))
		.catch(undefined)
		.optional();

/** The catalogue's state, as it lives in the URL: shareable and back-button safe. */
export const browseSchema = z.object({
	q: z.string().trim().max(80).optional().catch(undefined),
	tipo: z.string().trim().max(40).optional().catch(undefined),
	marca: z.string().trim().max(80).optional().catch(undefined),
	nutri: csv(NUTRISCORES),
	senza: csv(ALLERGEN_FILTERS),
	/** The «Tutte le zuppe» tab: the whole catalogue on the search screen, before any text. */
	vedi: z.literal("tutte").optional().catch(undefined),
	/** Page of the shelf still to taste, or of the search results. */
	pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
	/** Page of the ranking below the podium. */
	posti: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
	/** Products per page of the shelf and of the search, from TILE_PAGE_SIZES. */
	mostra: z.coerce
		.number()
		.refine(n => (TILE_PAGE_SIZES as readonly number[]).includes(n))
		.optional()
		.catch(undefined),
	/** Rows per page of the ranking, from ROW_PAGE_SIZES. */
	righe: z.coerce
		.number()
		.refine(n => (ROW_PAGE_SIZES as readonly number[]).includes(n))
		.optional()
		.catch(undefined),
});
export type BrowseParams = z.infer<typeof browseSchema>;

export function listParam(value: string | undefined): string[] {
	return value ? value.split(",") : [];
}

/** How many tiles a page of the shelf or of the search can hold; the first is the default. */
export const TILE_PAGE_SIZES = [12, 24, 48] as const;
/** How many rows a page of the ranking can hold, after the podium; the first is the default. */
export const ROW_PAGE_SIZES = [10, 20, 50] as const;
export const PODIUM_SIZE = 3;

/**
 * For every link that rewrites the home's URL: the router marks a link "current" when its
 * params are a subset of the URL's, so «Tutte» would always be current. With this, a param
 * the link leaves undefined must also be absent from the URL.
 */
export const EXACT_SEARCH = { explicitUndefined: true } as const;
