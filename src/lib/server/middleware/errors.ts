import { isNotFound, isRedirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";

import { AppError } from "../errors";
import { log } from "../log";

// An AppError passes through; anything else is logged and replaced, because its message ends up in a toast.
export const errorMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next, serverFnMeta }) => {
		try {
			return await next();
		} catch (err) {
			if (isRedirect(err) || isNotFound(err) || err instanceof AppError) throw err;
			log.error("{Fn} failed", { Fn: serverFnMeta.name }, err);
			throw new Error(
				"Qualcosa non ha funzionato da parte nostra. Riprova tra un momento."
			);
		}
	}
);
