// Makes a signed-in Google user an admin, or takes it back.
//
//   pnpm user:admin persona@gmail.com           grants
//   pnpm user:admin persona@gmail.com --revoke  revokes
//
// The user must have signed in with Google at least once: anonymous voters cannot be admins.
import { and, eq } from "drizzle-orm";
import { parseArgs } from "node:util";

import { getDb } from "@/db";
import { users } from "@/db/schema";

const { values, positionals } = parseArgs({
	allowPositionals: true,
	options: { revoke: { type: "boolean", default: false } },
});

async function main() {
	const email = positionals[0]?.trim().toLowerCase();
	if (!email) throw new Error("Usage: pnpm user:admin <email> [--revoke]");

	const [user] = await getDb()
		.update(users)
		.set({ role: values.revoke ? "user" : "admin" })
		.where(and(eq(users.email, email), eq(users.isAnonymous, false)))
		.returning({ id: users.id });
	if (!user)
		throw new Error(`No Google account with email ${email}: sign in once first`);

	console.log(
		values.revoke ? `${email} is no longer an admin` : `${email} is now an admin`
	);
	process.exit(0);
}

main().catch(error => {
	console.error(error.message);
	process.exit(1);
});
