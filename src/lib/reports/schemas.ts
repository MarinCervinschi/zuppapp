import { z } from "zod";

import { Invalid } from "@/lib/server/errors";

export const MAX_PHOTOS = 3;
// What `toJpeg` produces is far smaller; these only stop an upload that skipped it.
export const MAX_FULL_BYTES = 2_000_000;
export const MAX_SMALL_BYTES = 300_000;

const optionalText = (max: number) =>
	z
		.string()
		.trim()
		.max(max)
		.optional()
		.transform(value => value || null);

const reportFieldsSchema = z.object({
	ean: z.string().regex(/^\d{8,14}$/, "Il codice EAN ha da 8 a 14 cifre."),
	name: z
		.string()
		.trim()
		.min(1, "Scrivi il nome che leggi sulla confezione.")
		.max(160, "Il nome è troppo lungo: bastano le parole sulla confezione."),
	brand: optionalText(80),
	quantity: optionalText(40),
	note: optionalText(500),
	licenza: z.literal("si", {
		error: "Per mandarcela serve il tuo consenso alla licenza dei dati e delle foto.",
	}),
});

export type ReportPhoto = { full: File; small: File };
export type ReportInput = Omit<z.infer<typeof reportFieldsSchema>, "licenza"> & {
	photos: ReportPhoto[];
};

const text = (data: FormData, key: string) => {
	const value = data.get(key);
	return typeof value === "string" ? value : undefined;
};

/**
 * The report form travels as FormData, for the photos: each one twice, `full` and `small`
 * (400 px), in the same order.
 */
export function parseReportForm(data: unknown): ReportInput {
	if (!(data instanceof FormData))
		throw new Invalid("Il modulo è arrivato vuoto. Riprova.");
	const parsed = reportFieldsSchema.safeParse({
		ean: text(data, "ean"),
		name: text(data, "name"),
		brand: text(data, "brand"),
		quantity: text(data, "quantity"),
		note: text(data, "note"),
		licenza: text(data, "licenza"),
	});
	if (!parsed.success) throw new Invalid(parsed.error.issues[0].message);

	const files = (key: string) =>
		data.getAll(key).filter((value): value is File => value instanceof File);
	const full = files("full");
	const small = files("small");
	if (full.length !== small.length || full.length > MAX_PHOTOS)
		throw new Invalid(`Puoi mandare fino a ${MAX_PHOTOS} foto.`);
	if (
		full.some(file => file.size > MAX_FULL_BYTES) ||
		small.some(file => file.size > MAX_SMALL_BYTES)
	)
		throw new Invalid("Una foto è troppo pesante. Riprova a sceglierla.");

	const { licenza: _licenza, ...fields } = parsed.data;
	return {
		...fields,
		photos: full.map((file, index) => ({ full: file, small: small[index] })),
	};
}
