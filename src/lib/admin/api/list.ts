import { createServerFn } from "@tanstack/react-start";

import { adminMiddleware } from "@/lib/server/middleware/auth";

import { adminListSchema } from "../schemas";
import { listForAdmin } from "../service";

export const listForAdminFn = createServerFn({ method: "GET" })
	.middleware([adminMiddleware])
	.validator(adminListSchema)
	.handler(({ data }) => listForAdmin(data));
