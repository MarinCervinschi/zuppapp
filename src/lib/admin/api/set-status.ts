import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "@/lib/server/middleware/auth";

import { setStatusSchema } from "../schemas";
import { setProductsStatus } from "../service";

export const setProductsStatusFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.validator(setStatusSchema)
	.handler(({ data }) => setProductsStatus(data.ids, data.status));
