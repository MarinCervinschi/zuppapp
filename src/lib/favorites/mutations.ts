import { useMutation, useQueryClient } from "@tanstack/react-query";

import { track } from "@/lib/analytics/track";
import { toast } from "@/lib/toast";

import { setFavoriteFn } from "./api";
import { favoriteQueries } from "./queries";

/**
 * Puts a heart on or off at once and saves it behind: the ids list changes before the server
 * answers, and goes back if it refuses. Every heart on screen reads that one list.
 */
export function useSetFavorite() {
	const queryClient = useQueryClient();
	const key = favoriteQueries.ids().queryKey;

	return useMutation({
		mutationFn: (input: { productId: string; on: boolean }) =>
			setFavoriteFn({ data: input }),
		onMutate: async ({ productId, on }) => {
			await queryClient.cancelQueries({ queryKey: key });
			const previous = queryClient.getQueryData(key);
			queryClient.setQueryData(key, (ids = []) =>
				on ? [...new Set([...ids, productId])] : ids.filter(id => id !== productId)
			);
			return { previous };
		},
		onSuccess: (_result, { on }) =>
			track("preferito", { azione: on ? "aggiunto" : "tolto" }),
		onError: (_error, _input, context) => {
			queryClient.setQueryData(key, context?.previous);
			toast.error("Il cuore non è stato salvato. Controlla la connessione e riprova.");
		},
		onSettled: () => queryClient.invalidateQueries({ queryKey: ["viewer"] }),
	});
}
