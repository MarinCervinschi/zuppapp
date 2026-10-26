import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { authClient } from "@/lib/auth/client";
import { turnstileToken } from "@/lib/auth/turnstile";

import { castVoteFn, removeVoteFn } from "./api";

/** The first vote of someone with no session creates their anonymous voter. */
async function ensureVoter() {
	const { data: session } = await authClient.getSession();
	if (session) return;

	const token = await turnstileToken();
	const { error } = await authClient.signIn.anonymous({
		fetchOptions: token ? { headers: { "x-captcha-response": token } } : undefined,
	});
	if (error) throw new Error("Non è stato possibile registrare il voto. Riprova.");
}

export function useCastVote(ean: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (input: {
			productId: string;
			score: number;
			tagIds: string[];
		}) => {
			await ensureVoter();
			await castVoteFn({ data: input });
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["catalog", "card", ean] }),
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
