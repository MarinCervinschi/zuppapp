import { useMutation, useQueryClient } from "@tanstack/react-query";

import { track } from "@/lib/analytics/track";
import type { LookupResult } from "@/lib/catalog/lookup";

import { submitReportFn } from "./api";

export function useSubmitReport(ean: string) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (form: FormData) => submitReportFn({ data: form }),
		// Marked by hand rather than refetched: a refetch would ask Open Food Facts again.
		onSuccess: (_result, form) => {
			track("segnalazione", { foto: form.getAll("full").length });
			queryClient.setQueryData<LookupResult>(["catalog", "lookup", ean], current =>
				current?.kind === "missing" ? { ...current, reported: true } : current
			);
		},
	});
}
