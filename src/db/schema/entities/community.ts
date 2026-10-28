import { sql } from "drizzle-orm";
import {
	doublePrecision,
	index,
	integer,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	uniqueIndex,
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

/**
 * A product a signed-in user found missing, by EAN, with what the pack says and up to three
 * photos. The sender licenses the text under ODbL and the photos under CC BY-SA 4.0, as on
 * Open Food Facts. The photos sit in the bucket under `photoKeys` until an admin decides, and
 * are deleted then.
 */
export const productReports = pgTable(
	"product_reports",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		ean: text().notNull(),
		name: text(),
		brand: text(),
		quantity: text(),
		note: text(),
		photoKeys: text().array().default([]).notNull(),
		status: reportStatus().default("open").notNull(),
		resolvedBy: uuid().references(() => users.id, { onDelete: "set null" }),
		resolvedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [
		index("idx_product_reports_status").on(table.status),
		// One open report per person and product: sending again updates it.
		uniqueIndex("product_reports_open_key")
			.on(table.userId, table.ean)
			.where(sql`${table.status} = 'open'`),
	]
);

/** The soups someone keeps a heart on, to find them again. Private: no count is shown to others. */
export const favorites = pgTable(
	"favorites",
	{
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [primaryKey({ columns: [table.userId, table.productId] })]
);
