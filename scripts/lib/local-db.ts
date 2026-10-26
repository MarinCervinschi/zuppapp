/**
 * Fake data and instant publishing are for the database on this machine. `pnpm dev` reaches the
 * production database too, so NODE_ENV says nothing: the host does.
 */
export function assertLocalDatabase(what: string) {
	const host = new URL(process.env.DATABASE_URL ?? "postgresql://").hostname;
	if (host !== "127.0.0.1" && host !== "localhost")
		throw new Error(`${what} only runs on a local database, not on ${host}`);
}
