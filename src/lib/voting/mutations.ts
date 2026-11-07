import { type QueryClient, useMutation, useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth/client";
import { turnstileToken } from "@/lib/auth/turnstile";
import type { ListPage, ProductListItem, RankingPage } from "@/lib/catalog/types";
import type { Score } from "@/lib/ranking/rules";
import { toast } from "@/lib/toast";

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

// The lists whose cards show the reader's own stars.
const LIST_KEYS = new Set(["ranking", "to-taste", "search"]);

/**
 * Writes the reader's new stars into every cached list that holds the soup, so the card under the
 * sheet shows the vote at once, without refetching (which would move the cards around).
 */
function patchListVotes(
	queryClient: QueryClient,
	productId: string,
	score: Score | null
) {
	const patch = (item: ProductListItem) =>
		item.id === productId ? { ...item, myScore: score } : item;
	queryClient.setQueriesData<ListPage | RankingPage>(
		{
			predicate: ({ queryKey: [area, kind, sub] }) =>
				(area === "catalog" && LIST_KEYS.has(String(kind))) ||
				(area === "viewer" && kind === "favorites" && sub === "page"),
		},
		data => {
			if (!data) return data;
			if ("items" in data) return { ...data, items: data.items.map(patch) };
			return { ...data, podium: data.podium.map(patch), rows: data.rows.map(patch) };
		}
	);
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
		onSuccess: (_result, { productId, score }) => {
			patchListVotes(queryClient, productId, score as Score);
			refreshAfterVote(queryClient, ean);
		},
		onError: (error: Error) => toast.error(error.message),
	});
}

export function useRemoveVote(ean: string) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (productId: string) => removeVoteFn({ data: { productId } }),
		onSuccess: (_result, productId) => {
			patchListVotes(queryClient, productId, null);
			refreshAfterVote(queryClient, ean);
		},
		onError: (error: Error) => toast.error(error.message),
	});
}
