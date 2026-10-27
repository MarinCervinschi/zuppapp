import { z } from "zod";

export const MAX_TAGS_PER_VOTE = 3;

export const castVoteSchema = z.object({
	productId: z.uuid(),
	score: z.number().int().min(1).max(5),
	// Left out by the quick vote on a list tile: the tags already chosen stay as they are.
	tagIds: z
		.array(z.uuid())
		.max(MAX_TAGS_PER_VOTE, `Al massimo ${MAX_TAGS_PER_VOTE} tag`)
		.optional(),
});

export const removeVoteSchema = z.object({ productId: z.uuid() });
