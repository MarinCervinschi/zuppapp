import { createStart } from "@tanstack/react-start";

import { errorMiddleware } from "@/lib/server/middleware/errors";

export const startInstance = createStart(() => ({
	functionMiddleware: [errorMiddleware],
}));
