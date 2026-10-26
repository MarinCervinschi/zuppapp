import {
	boolean,
	index,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

// The four tables Better Auth reads and writes; timestamps are Date because it does.

export const userRole = pgEnum("user_role", ["user", "admin"]);

export const users = pgTable(
	"users",
	{
		id: uuid().defaultRandom().primaryKey(),
		// Google's name, kept but never shown: the public name is `nickname`.
		name: text().notNull(),
		email: text().notNull(),
		emailVerified: boolean().default(false).notNull(),
		image: text(),
		isAnonymous: boolean().default(false).notNull(),
		nickname: text(),
		avatarSeed: text(),
		role: userRole().default("user").notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [unique("users_email_key").on(table.email)]
);

export const sessions = pgTable(
	"sessions",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		token: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		ipAddress: text(),
		userAgent: text(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [
		index("idx_sessions_user_id").on(table.userId),
		unique("sessions_token_key").on(table.token),
	]
);

export const accounts = pgTable(
	"accounts",
	{
		id: uuid().defaultRandom().primaryKey(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		providerId: text().notNull(),
		accountId: text().notNull(),
		password: text(),
		accessToken: text(),
		refreshToken: text(),
		idToken: text(),
		accessTokenExpiresAt: timestamp({ withTimezone: true }),
		refreshTokenExpiresAt: timestamp({ withTimezone: true }),
		scope: text(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [
		index("idx_accounts_user_id").on(table.userId),
		unique("accounts_provider_id_account_id_key").on(table.providerId, table.accountId),
	]
);

export const verifications = pgTable(
	"verifications",
	{
		id: uuid().defaultRandom().primaryKey(),
		identifier: text().notNull(),
		value: text().notNull(),
		expiresAt: timestamp({ withTimezone: true }).notNull(),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [index("idx_verifications_identifier").on(table.identifier)]
);
