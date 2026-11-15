import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "@/lib/server/middleware/auth";

import { productIdSchema } from "../schemas";
import { importProductFromOff } from "../service";

export const importProductFromOffFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.validator(productIdSchema)
	.handler(({ data }) => importProductFromOff(data.id));
