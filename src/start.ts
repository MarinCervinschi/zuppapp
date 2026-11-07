import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

import { errorMiddleware } from "@/lib/server/middleware/errors";

// Server functions answer only to requests from our own pages; Better Auth's routes check the
// origin on their own.
const csrfMiddleware = createCsrfMiddleware({
	filter: ctx => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
	requestMiddleware: [csrfMiddleware],
	functionMiddleware: [errorMiddleware],
}));
