import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { listForAdminFn, listReportsFn } from "./api";
import type { AdminListParams } from "./schemas";

export const adminQueries = {
	list: (params: AdminListParams) =>
		queryOptions({
			queryKey: ["admin", "list", params],
			queryFn: () => listForAdminFn({ data: params }),
			placeholderData: keepPreviousData,
			staleTime: 0,
		}),
	reports: () =>
		queryOptions({
			queryKey: ["admin", "reports"],
			queryFn: () => listReportsFn(),
			staleTime: 0,
		}),
};
