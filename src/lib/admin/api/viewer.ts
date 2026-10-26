import { createServerFn } from "@tanstack/react-start";

import { optionalUserMiddleware } from "@/lib/server/middleware/auth";

/** Whether the current visitor may see the admin pages; nothing else about them. */
export const isAdminFn = createServerFn({ method: "GET" })
	.middleware([optionalUserMiddleware])
	.handler(({ context }) =>
		Boolean(context.user && !context.user.isAnonymous && context.user.role === "admin")
	);
