import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { PRODOTTI, count } from "@/lib/plural";

import { correctProductFn, resolveReportsFn, setProductsStatusFn } from "./api";
import type { ProductCorrectionInput, ResolveReportsInput } from "./schemas";

const STATUS_DONE = {
	draft: "rimessi in bozza",
	published: "pubblicati",
	archived: "archiviati",
};
const DONE_ONE = {
	draft: "rimesso in bozza",
	published: "pubblicato",
	archived: "archiviato",
};

function useRefresh() {
	const queryClient = useQueryClient();
	// The public catalogue changes too when a product is published or corrected, and so do the
	// reader's own lists ("Le mie zuppe", "Preferiti"), which show the same names and photos.
	// The scanner's lookup is left alone: refetching it would ask Open Food Facts again.
	return () => {
		queryClient.invalidateQueries({ queryKey: ["admin"] });
		queryClient.invalidateQueries({
			predicate: query =>
				query.queryKey[0] === "catalog" && query.queryKey[1] !== "lookup",
		});
		queryClient.invalidateQueries({ queryKey: ["viewer"] });
	};
}

type Status = keyof typeof STATUS_DONE;

/**
 * Publishes, archives or sends back to draft, then offers to undo: the move is frequent and
 * reversible, so an undo in the toast beats asking first.
 */
export function useSetProductsStatus() {
	const refresh = useRefresh();
	const mutation = useMutation({
		mutationFn: (input: { ids: string[]; status: Status; from: Status }) =>
			setProductsStatusFn({ data: { ids: input.ids, status: input.status } }),
		onSuccess: ({ updated }, { ids, status, from }) => {
			refresh();
			toast.success(
				`${count(updated, PRODOTTI)} ${updated === 1 ? DONE_ONE[status] : STATUS_DONE[status]}`,
				{
					action: {
						label: "Annulla",
						onClick: () => mutation.mutate({ ids, status: from, from: status }),
					},
				}
			);
		},
		onError: (error: Error) => toast.error(error.message),
	});
	return mutation;
}

export function useCorrectProduct() {
	const refresh = useRefresh();
	return useMutation({
		mutationFn: (input: ProductCorrectionInput) => correctProductFn({ data: input }),
		onSuccess: () => {
			refresh();
			toast.success("Correzione salvata");
		},
		onError: (error: Error) => toast.error(error.message),
	});
}

const RESOLVED = {
	off: "Importata da Open Food Facts: la trovi tra le bozze",
	create: "Bozza creata: la trovi tra le bozze",
	close: "Segnalazioni chiuse",
	reject: "Segnalazioni rifiutate",
};

export function useResolveReports() {
	const refresh = useRefresh();
	return useMutation({
		mutationFn: (input: ResolveReportsInput) => resolveReportsFn({ data: input }),
		onSuccess: (_, { action }) => {
			refresh();
			toast.success(RESOLVED[action]);
		},
		onError: (error: Error) => toast.error(error.message),
	});
}
