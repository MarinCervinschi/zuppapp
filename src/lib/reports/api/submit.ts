import { createServerFn } from "@tanstack/react-start";

import { accountMiddleware } from "@/lib/server/middleware/auth";

import { parseReportForm } from "../schemas";
import { submitReport } from "../service";

export const submitReportFn = createServerFn({ method: "POST" })
	.middleware([accountMiddleware])
	.validator(parseReportForm)
	.handler(({ data, context }) => submitReport(context.user.id, data));
