import { createServerFn } from "@tanstack/react-start";

import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

import { lookupEan } from "../lookup";
import { eanSchema } from "../schemas";

export const lookupEanFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.validator(eanSchema)
	.handler(({ data, context }) => lookupEan(data.ean, context.user?.id ?? null));
