import { createServerFn } from "@tanstack/react-start";

import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

import { getFacets, getRanking, getToTaste, searchCatalog } from "../browse";
import { browseSchema } from "../schemas";

export const rankingFn = createServerFn({ method: "GET" })
	.validator(browseSchema)
	.handler(({ data }) => getRanking(data));

export const toTasteFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.validator(browseSchema)
	.handler(({ data, context }) => getToTaste(data, context.user?.id ?? null));

export const searchFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.validator(browseSchema)
	.handler(({ data, context }) => searchCatalog(data, context.user?.id ?? null));

export const facetsFn = createServerFn({ method: "GET" })
	.validator(browseSchema)
	.handler(({ data }) => getFacets(data));
