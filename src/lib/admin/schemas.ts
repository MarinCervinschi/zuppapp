import { z } from "zod";

export const ADMIN_PAGE_SIZE = 30;

export const STATUSES = ["draft", "published", "archived"] as const;

/** Without `ordine`, the queue order: products with no type first, then by name. */
export const ADMIN_SORTS = ["nome", "voti", "recenti", "modificati"] as const;
/** `tipo=nessuno` is the products still waiting for a type. */
export const NO_SUBTYPE = "nessuno";

const yesNo = z.enum(["si", "no"]).optional().catch(undefined);

export const adminListSchema = z.object({
	stato: z.enum(STATUSES).optional().catch(undefined),
	// The router reads a search of digits only (an EAN) as a number: back to text.
	q: z
		.preprocess(
			value => (typeof value === "number" ? String(value) : value),
			z.string().trim().max(80)
		)
		.optional()
		.catch(undefined),
	tipo: z.string().trim().max(40).optional().catch(undefined),
	foto: yesNo,
	voti: yesNo,
	corretti: yesNo,
	ordine: z.enum(ADMIN_SORTS).optional().catch(undefined),
	pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});
export type AdminListParams = z.infer<typeof adminListSchema>;

export const setStatusSchema = z.object({
	ids: z.array(z.uuid()).min(1).max(200),
	status: z.enum(STATUSES),
});

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.transform(value => value || null);

export const correctProductSchema = z.object({
	id: z.uuid(),
	name: z.string().trim().min(1, "Scrivi il nome del prodotto.").max(160),
	brand: optionalText(80),
	subtype: optionalText(40),
	producerUrl: optionalText(500).refine(
		value => value === null || /^https?:\/\//.test(value),
		"Incolla il link completo, che inizia con https://"
	),
});
export type ProductCorrection = z.infer<typeof correctProductSchema>;
/** What the form sends: empty strings, which the schema turns into nulls. */
export type ProductCorrectionInput = z.input<typeof correctProductSchema>;

const ean = z.string().regex(/^\d{8,14}$/);

/**
 * What an admin does with the open reports of one EAN: import it from Open Food Facts, create
 * the draft from what the reports say, close them because the product is already here, or
 * reject them.
 */
export const resolveReportsSchema = z.discriminatedUnion("action", [
	z.object({ action: z.literal("off"), ean }),
	z.object({
		action: z.literal("create"),
		ean,
		name: z.string().trim().min(1, "Scrivi il nome del prodotto.").max(160),
		brand: optionalText(80),
		quantity: optionalText(40),
		/** The report photo that becomes the product's, by its 400 px key. */
		photoKey: z.string().startsWith("segnalazioni/").nullable(),
	}),
	z.object({ action: z.literal("close"), ean }),
	z.object({ action: z.literal("reject"), ean }),
]);
export type ResolveReports = z.infer<typeof resolveReportsSchema>;
export type ResolveReportsInput = z.input<typeof resolveReportsSchema>;
