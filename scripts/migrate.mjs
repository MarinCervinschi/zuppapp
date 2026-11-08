// Applies the pending migrations in drizzle/ and exits. Run by docker-entrypoint.sh before the
// server starts, so a deploy never serves code ahead of its schema; plain JS, so the runtime image
// needs no TypeScript tooling (Node strips the types of log.ts itself). One instance only: two
// starting at once would race.
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

import { createLogger, flushLogs } from "../src/lib/server/log.ts";

const log = createLogger({ Source: "migrate" });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	log.error("DATABASE_URL is not set");
	await flushLogs();
	process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1 });
const startedAt = performance.now();
try {
	await migrate(drizzle(pool), {
		migrationsFolder: new URL("../drizzle", import.meta.url).pathname,
	});
	log.info("Starting: migrations applied in {Elapsed}ms", {
		Elapsed: Math.round(performance.now() - startedAt),
	});
} catch (error) {
	log.error("Migrations failed: the server will not start", {}, error);
	process.exitCode = 1;
} finally {
	await pool.end();
	await flushLogs();
}
