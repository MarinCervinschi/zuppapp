import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { getAuth } from "@/lib/auth/server";
import { accountMiddleware } from "@/lib/server/middleware/auth";

import { deleteAccount } from "../service";

export const deleteAccountFn = createServerFn({ method: "POST" })
	.middleware([accountMiddleware])
	.handler(async ({ context }) => {
		await deleteAccount(context.user.id);
		// The session rows are gone; this clears the cookies too, cache included, so the browser
		// does not keep showing the account for the 5 minutes of the cookie cache.
		await getAuth()
			.api.signOut({ headers: getRequestHeaders() })
			.catch(() => {});
	});
