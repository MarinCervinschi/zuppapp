import { createServerFn } from "@tanstack/react-start";

import { voterMiddleware } from "@/lib/server/middleware/auth";

import { castVoteSchema } from "../schemas";
import { castVote } from "../service";

export const castVoteFn = createServerFn({ method: "POST" })
	.middleware([voterMiddleware])
	.validator(castVoteSchema)
	.handler(({ data, context }) => castVote(context.user.id, data));
