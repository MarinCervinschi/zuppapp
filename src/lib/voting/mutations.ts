import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";
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

/**
 * After a vote is cast or removed, everything that shows stars or the reader's votes is stale:
 * the product's card, every list, "Le mie zuppe" and the counts in the profile. The lists are
 * only marked, not refetched now: the shelf under the reader's thumb would move the tile they
 * just tapped. They load fresh the next time they are opened. The ranking, which a vote can
 * reorder, and the product's own page refetch at once. The scanner's lookup is left alone:
 * refetching it would ask Open Food Facts again.
 */
function refreshAfterVote(queryClient: QueryClient, ean?: string) {
	queryClient.invalidateQueries({
		predicate: query =>
			query.queryKey[0] === "catalog" && query.queryKey[1] !== "lookup",
		refetchType: "none",
	});
	queryClient.invalidateQueries({
		queryKey: ean ? ["catalog", "card", ean] : ["catalog", "ranking"],
	});
	queryClient.invalidateQueries({ queryKey: ["viewer"] });
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
		// The first vote also creates the voter: the viewer is in what gets refreshed.
		onSuccess: () => refreshAfterVote(queryClient, ean),
		onError: (error: Error) => toast.error(error.message),
	});
}

export function useRemoveVote(ean: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (productId: string) => removeVoteFn({ data: { productId } }),
		onSuccess: () => refreshAfterVote(queryClient, ean),
		onError: (error: Error) => toast.error(error.message),
	});
}
