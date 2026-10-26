import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { AppError } from "../errors";

// An AppError passes through; anything else is logged and replaced, because its message ends up in a toast.
export const errorMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		try {
			return await next();
		} catch (err) {
			if (isRedirect(err) || isNotFound(err) || err instanceof AppError) throw err;
			console.error(err);
			throw new Error("Si è verificato un errore. Riprova più tardi.");
		}
	}
);
