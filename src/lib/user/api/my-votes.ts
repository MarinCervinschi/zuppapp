import { createServerFn } from "@tanstack/react-start";

import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

import { myVotesSchema } from "../schemas";
import { getMyVotes } from "../service";

/** Anyone's own votes, anonymous included; null for a visitor who never voted. */
export const myVotesFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.validator(myVotesSchema)
	.handler(({ data, context }) =>
		context.user ? getMyVotes(context.user.id, data.pagina ?? 1) : null
	);
