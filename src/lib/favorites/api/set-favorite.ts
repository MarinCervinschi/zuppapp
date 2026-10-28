import { createServerFn } from "@tanstack/react-start";

import { accountMiddleware } from "@/lib/server/middleware/auth";

import { setFavoriteSchema } from "../schemas";
import { setFavorite } from "../service";

/** Favourites belong to an account: an anonymous voter is asked to sign in first. */
export const setFavoriteFn = createServerFn({ method: "POST" })
	.middleware([accountMiddleware])
	.validator(setFavoriteSchema)
	.handler(({ data, context }) =>
		setFavorite(context.user.id, data.productId, data.on)
	);
