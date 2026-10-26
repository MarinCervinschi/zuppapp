import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

export type Db = ReturnType<typeof createDb>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type DbOrTx = Db | Tx;

let _db: Db | null = null;

function createDb(pool: Pool) {
	return drizzle(pool, { schema, casing: "snake_case" });
}

export function getDb(): Db {
	if (_db) return _db;

	const connectionString = process.env.DATABASE_URL;
	if (!connectionString) throw new Error("DATABASE_URL is not set");

	_db = createDb(new Pool({ connectionString, max: 10 }));
	return _db;
}
