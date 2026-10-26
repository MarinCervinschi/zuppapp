import {
	doublePrecision,
	index,
	integer,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { products } from "./catalog";

/** The duel is its own game: it never feeds the main ranking. */
export const duels = pgTable(
	"duels",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productAId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		productBId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		winnerId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [index("idx_duels_user").on(table.userId)]
);

export const duelRatings = pgTable("duel_ratings", {
	productId: uuid()
		.primaryKey()
		.references(() => products.id, { onDelete: "cascade" }),
	elo: doublePrecision().default(1500).notNull(),
	matches: integer().default(0).notNull(),
});

export const reportStatus = pgEnum("report_status", ["open", "done", "rejected"]);

/** A product a signed-in user found missing, by EAN. */
export const productReports = pgTable(
	"product_reports",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		ean: text().notNull(),
		note: text(),
		status: reportStatus().default("open").notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [index("idx_product_reports_status").on(table.status)]
);
