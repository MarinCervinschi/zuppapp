// Applies the pending migrations in drizzle/ and exits. Run by docker-entrypoint.sh before the
// server starts, so a deploy never serves code ahead of its schema; plain JS, so the runtime image
// needs no TypeScript tooling. One instance only: two starting at once would race.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error("DATABASE_URL is not set");
	process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });
try {
	await migrate(drizzle(pool), { migrationsFolder: new URL("../drizzle", import.meta.url).pathname });
	console.log("Migrations applied");
} finally {
	await pool.end();
}
