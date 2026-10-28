import { createServerFn } from "@tanstack/react-start";

import { listOpenReports } from "@/lib/reports/service";
import { adminMiddleware } from "@/lib/server/middleware/auth";

import { adminCounts } from "../service";

export const listReportsFn = createServerFn({ method: "GET" })
	.middleware([adminMiddleware])
	.handler(async () => {
		const [groups, counts] = await Promise.all([listOpenReports(), adminCounts()]);
		return { groups, counts };
	});
