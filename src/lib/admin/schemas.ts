import { z } from "zod";

export const ADMIN_PAGE_SIZE = 30;

export const STATUSES = ["draft", "published", "archived"] as const;

export const adminListSchema = z.object({
	stato: z.enum(STATUSES).optional().catch(undefined),
	q: z.string().trim().max(80).optional().catch(undefined),
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
