import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";

import { NotFound } from "@/lib/server/errors";
import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

import { eanSchema } from "../schemas";
import { getProductCard } from "../service";

export const getProductCardFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.validator(eanSchema)
	.handler(async ({ data, context }) => {
		try {
			return await getProductCard(data.ean, context.user?.id ?? null);
		} catch (error) {
			// The router's own not-found, so the page shows its notFoundComponent, not an error.
			if (error instanceof NotFound) throw notFound();
			throw error;
		}
	});
