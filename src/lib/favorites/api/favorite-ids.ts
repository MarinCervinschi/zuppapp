import { createServerFn } from "@tanstack/react-start";

import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

import { getFavoriteIds } from "../service";

/** The reader's hearts; none without an account. */
export const favoriteIdsFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.handler(({ context }) =>
		context.user && !context.user.isAnonymous
			? getFavoriteIds(context.user.id)
			: ([] as string[])
	);
