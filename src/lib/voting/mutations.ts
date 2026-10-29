import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { turnstileToken } from "@/lib/auth/turnstile";

import { castVoteFn, removeVoteFn } from "./api";

/** The first vote of someone with no session creates their anonymous voter: true when it did. */
async function ensureVoter() {
	const { data: session } = await authClient.getSession();
	if (session) return false;

	const token = await turnstileToken();
	const { error } = await authClient.signIn.anonymous({
		fetchOptions: token ? { headers: { "x-captcha-response": token } } : undefined,
	});
	if (error)
		throw new Error(
			"Il voto non è partito. Controlla la connessione e tocca di nuovo le stelle."
		);
	return true;
}

export function useCastVote(ean?: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			productId: string;
			score: number;
			tagIds?: string[];
		}) => {
			const firstVote = await ensureVoter();
			await castVoteFn({ data: input });
			return { firstVote };
		},
		// From a list tile the ranking may change, but the shelf under the reader's thumb stays
		// put: refetching it would move the tile they just tapped.
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ean ? ["catalog", "card", ean] : ["catalog", "ranking"],
			});
			// The first vote creates the voter, and every vote changes "Le mie zuppe".
			queryClient.invalidateQueries({ queryKey: ["viewer"] });
		},
		onError: (error: Error) => toast.error(error.message),
	});
}

export function useRemoveVote(ean: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (productId: string) => removeVoteFn({ data: { productId } }),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["catalog", "card", ean] }),
		onError: (error: Error) => toast.error(error.message),
	});
}
