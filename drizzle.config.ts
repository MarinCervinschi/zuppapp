import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url)
	throw new Error(
		"DATABASE_URL is not set. Run drizzle-kit through the pnpm db:* scripts."
	);

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema",
	out: "./drizzle",
	dbCredentials: { url },
	casing: "snake_case",
	verbose: true,
	strict: true,
});
