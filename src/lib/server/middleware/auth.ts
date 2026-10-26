import { createMiddleware } from "@tanstack/react-start";

import { readSession } from "@/lib/auth/server";

import { Forbidden, Unauthorized } from "../errors";

type SessionUser = {
	id: string;
	isAnonymous: boolean;
	role: string;
};

async function readSessionUser(): Promise<SessionUser | null> {
	const session = await readSession();
	if (!session) return null;
	return {
		id: session.user.id,
		isAnonymous: Boolean(session.user.isAnonymous),
		role: session.user.role ?? "user",
	};
}

/** Any voter, anonymous included: what voting needs. */
export const voterMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const user = await readSessionUser();
		if (!user) throw new Unauthorized();
		return next({ context: { user } });
	}
);

/** A Google account: duel, product reports, profile. */
export const accountMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const user = await readSessionUser();
		if (!user || user.isAnonymous)
			throw new Unauthorized("Accedi con Google per continuare");
		return next({ context: { user } });
	}
);

export const adminMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => {
		const user = await readSessionUser();
		if (!user || user.isAnonymous) throw new Unauthorized();
		if (user.role !== "admin") throw new Forbidden();
		return next({ context: { user } });
	}
);

export const optionalUserMiddleware = createMiddleware({ type: "function" }).server(
	async ({ next }) => next({ context: { user: await readSessionUser() } })
);
