import { getRequestHeaders } from "@tanstack/react-start/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, captcha } from "better-auth/plugins";
import { tanstackStartCookies } from "better-auth/tanstack-start";

import { getDb } from "@/db";
import { accounts, sessions, users, verifications } from "@/db/schema";
import { moveVotes } from "@/lib/voting/service";

import { anonymousName } from "./names";

const SESSION_CACHE_SECONDS = 5 * 60;
// An anonymous voter is a cookie: a long session is what keeps "Le mie zuppe" alive.
const SESSION_EXPIRES_IN_SECONDS = 60 * 60 * 24 * 365;

function socialProviders() {
	if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) return {};
	return {
		google: {
			clientId: process.env.GOOGLE_CLIENT_ID,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET,
		},
	};
}

// Turnstile guards only the creation of an anonymous voter, which is the cheap thing to abuse.
function turnstile() {
	const secretKey = process.env.TURNSTILE_SECRET_KEY;
	if (!secretKey) return [];
	return [
		captcha({
			provider: "cloudflare-turnstile",
			secretKey,
			endpoints: ["/sign-in/anonymous"],
		}),
	];
}

function createAuth() {
	return betterAuth({
		baseURL: process.env.BETTER_AUTH_URL,
		secret: process.env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(getDb(), {
			provider: "pg",
			schema: {
				user: users,
				session: sessions,
				account: accounts,
				verification: verifications,
			},
		}),
		advanced: {
			database: { generateId: "uuid" },
			// No CDN in front: Traefik writes the address it sees here. Better Auth uses it for its
			// rate limit and Turnstile's `remoteip`, and only when it holds one address.
			ipAddress: { ipAddressHeaders: ["x-forwarded-for"] },
		},
		databaseHooks: {
			session: {
				create: {
					// The IP serves only short-lived rate limits; a session lasts a year.
					before: async () => ({ data: { ipAddress: null } }),
				},
			},
		},
		socialProviders: socialProviders(),
		session: {
			expiresIn: SESSION_EXPIRES_IN_SECONDS,
			cookieCache: { enabled: true, maxAge: SESSION_CACHE_SECONDS },
		},
		user: {
			additionalFields: {
				nickname: { type: "string", required: false, input: false },
				avatarSeed: { type: "string", required: false, input: false },
				role: { type: "string", required: false, input: false },
			},
		},
		plugins: [
			anonymous({
				generateName: () => anonymousName(),
				onLinkAccount: ({ anonymousUser, newUser }) =>
					moveVotes(getDb(), anonymousUser.user.id, newUser.user.id),
			}),
			...turnstile(),
			tanstackStartCookies(),
		],
	});
}

let _auth: ReturnType<typeof createAuth> | null = null;

/** The Better Auth instance, built on first use so the environment is loaded by then. */
export function getAuth() {
	if (!_auth) _auth = createAuth();
	return _auth;
}

/** The session of the current request, or null; reads the cookie cache before the database. */
export function readSession() {
	return getAuth().api.getSession({ headers: getRequestHeaders() });
}

export function isGoogleEnabled() {
	return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}
