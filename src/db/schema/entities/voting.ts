import { sql } from "drizzle-orm";
import {
	boolean,
	check,
	foreignKey,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	primaryKey,
	smallint,
	text,
	timestamp,
	uuid,
} from "drizzle-orm/pg-core";

import { users } from "./auth";
import { products } from "./catalog";

export const tagSentiment = pgEnum("tag_sentiment", [
	"positive",
	"negative",
	"neutral",
]);

/** One per voter and product: voting again changes the score. 1 Mai più · 2 Si mangia · 3 Buona · 4 La ricompro. */
export const votes = pgTable(
	"votes",
	{
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		productId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		score: smallint().notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [
		primaryKey({ columns: [table.userId, table.productId] }),
		check("votes_score_range", sql`${table.score} between 1 and 4`),
	]
);

export const tags = pgTable("tags", {
	id: uuid().defaultRandom().primaryKey(),
	slug: text().notNull().unique(),
	label: text().notNull(),
	sentiment: tagSentiment().notNull(),
	active: boolean().default(true).notNull(),
	position: integer().default(0).notNull(),
});

export const voteTags = pgTable(
	"vote_tags",
	{
		userId: uuid().notNull(),
		productId: uuid().notNull(),
		tagId: uuid()
			.notNull()
			.references(() => tags.id, { onDelete: "cascade" }),
	},
	table => [
		primaryKey({ columns: [table.userId, table.productId, table.tagId] }),
		// A tag belongs to a vote: removing the vote removes its tags.
		foreignKey({
			columns: [table.userId, table.productId],
			foreignColumns: [votes.userId, votes.productId],
			name: "vote_tags_vote_fkey",
		})
			.onDelete("cascade")
			// Linking an anonymous user to Google moves its votes, tags included.
			.onUpdate("cascade"),
	]
);

/**
 * A rollup of `votes`, written in the same transaction as the vote that changes it. The
 * Bayesian score is not stored: it depends on the global mean, which every vote moves.
 */
export const productStats = pgTable("product_stats", {
	productId: uuid()
		.primaryKey()
		.references(() => products.id, { onDelete: "cascade" }),
	votesCount: integer().default(0).notNull(),
	votesRegistered: integer().default(0).notNull(),
	scoreSum: integer().default(0).notNull(),
	rebuyCount: integer().default(0).notNull(),
	/** Votes per face, "1" to "4": the spread the ranking draws. */
	scoreCounts: jsonb().$type<Record<string, number>>().default({}).notNull(),
	tagCounts: jsonb().$type<Record<string, number>>().default({}).notNull(),
	updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});
