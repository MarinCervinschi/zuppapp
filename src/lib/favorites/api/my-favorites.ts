import { createServerFn } from "@tanstack/react-start";

import { getFavoritesPage } from "@/lib/catalog/browse";
import { accountMiddleware } from "@/lib/server/middleware/auth";

import { favoritesPageSchema } from "../schemas";

/** «I tuoi preferiti», newest heart first, as catalogue cards. */
export const myFavoritesFn = createServerFn({ method: "GET" })
	.middleware([accountMiddleware])
	.validator(favoritesPageSchema)
	.handler(({ data, context }) => getFavoritesPage(context.user.id, data.pagina ?? 1));
