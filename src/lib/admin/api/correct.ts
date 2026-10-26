import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "@/lib/server/middleware/auth";

import { correctProductSchema } from "../schemas";
import { correctProduct } from "../service";

export const correctProductFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.validator(correctProductSchema)
	.handler(({ data }) => correctProduct(data));
