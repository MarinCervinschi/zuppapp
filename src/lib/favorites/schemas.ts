import { z } from "zod";

export const FAVORITES_PAGE_SIZE = 24;

export const setFavoriteSchema = z.object({
	productId: z.uuid(),
	/** true puts the heart on, false takes it off: setting, not toggling, so a retry is harmless. */
	on: z.boolean(),
});

export const favoritesPageSchema = z.object({
	pagina: z.coerce.number().int().min(1).max(1000).optional().catch(undefined),
});
