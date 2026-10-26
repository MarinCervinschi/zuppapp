import { createServerFn } from "@tanstack/react-start";

import { voterMiddleware } from "@/lib/server/middleware/auth";

import { removeVoteSchema } from "../schemas";
import { removeVote } from "../service";

export const removeVoteFn = createServerFn({ method: "POST" })
	.middleware([voterMiddleware])
	.validator(removeVoteSchema)
	.handler(({ data, context }) => removeVote(context.user.id, data.productId));
