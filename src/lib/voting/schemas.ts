import { z } from "zod";

export const MAX_TAGS_PER_VOTE = 3;

export const castVoteSchema = z.object({
	productId: z.uuid(),
	score: z.number().int().min(1).max(5),
	// Optional for a page loaded before the vote panel always sent them: without it, the tags
	// already chosen stay as they are.
	tagIds: z
		.array(z.uuid())
		.max(MAX_TAGS_PER_VOTE, `Al massimo ${MAX_TAGS_PER_VOTE} tag`)
		.optional(),
});

export const removeVoteSchema = z.object({ productId: z.uuid() });
