import { useMutation, useQueryClient } from "@tanstack/react-query";

import { track } from "@/lib/analytics/track";
import { catalogQueries } from "@/lib/catalog/queries";

import { submitReportFn } from "./api";

export function useSubmitReport(ean: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (form: FormData) => submitReportFn({ data: form }),
		// Marked by hand rather than refetched: a refetch would ask Open Food Facts again.
		onSuccess: (_result, form) => {
			track("segnalazione", { foto: form.getAll("full").length });
			queryClient.setQueryData(catalogQueries.lookup(ean).queryKey, current =>
				current?.kind === "missing" ? { ...current, reported: true } : current
			);
		},
	});
}
