import { z } from "zod";

// EAN-8, UPC-A, EAN-13 and GTIN-14: digits only.
export const eanSchema = z.object({
	ean: z.string().regex(/^\d{8,14}$/, "Codice EAN non valido"),
});
