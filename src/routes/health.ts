import { createFileRoute } from "@tanstack/react-router";
import { sql } from "drizzle-orm";

import { getDb } from "@/db";

// Coolify's health check: the app is up only when it can reach the database. No details in the
// body, since the route is public.
export const Route = createFileRoute("/health")({
	server: {
		handlers: {
			GET: async () => {
				try {
					await getDb().execute(sql`select 1`);
					return new Response("ok", {
						headers: { "cache-control": "no-store" },
					});
				} catch {
					return new Response("database unreachable", {
						status: 503,
						headers: { "cache-control": "no-store" },
					});
				}
			},
		},
	},
});
