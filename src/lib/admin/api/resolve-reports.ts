import { createServerFn } from "@tanstack/react-start";

import { resolveReports } from "@/lib/reports/service";
import { adminMiddleware } from "@/lib/server/middleware/auth";

import { resolveReportsSchema } from "../schemas";

export const resolveReportsFn = createServerFn({ method: "POST" })
	.middleware([adminMiddleware])
	.validator(resolveReportsSchema)
	.handler(({ data, context }) => resolveReports(context.user.id, data));
