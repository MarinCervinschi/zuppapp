import {
	type AnyPgColumn,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	smallint,
	text,
	timestamp,
	unique,
	uuid,
} from "drizzle-orm/pg-core";

export const productStatus = pgEnum("product_status", [
	"draft",
	"published",
	"archived",
]);

export const categories = pgTable("categories", {
	id: uuid().defaultRandom().primaryKey(),
	slug: text().notNull().unique(),
	name: text().notNull(),
	parentId: uuid().references((): AnyPgColumn => categories.id),
	// Which keys a product of this category carries in `products.attributes`, and their labels.
	attributesSchema: jsonb().$type<Record<string, unknown>>().default({}).notNull(),
	createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
});

export const products = pgTable(
	"products",
	{
		id: uuid().defaultRandom().primaryKey(),
		ean: text().notNull().unique(),
		categoryId: uuid()
			.notNull()
			.references(() => categories.id),
		// vellutata, minestrone, legumi, … — free text within the category, validated by the app.
		subtype: text(),
		name: text().notNull(),
		brand: text(),
		quantity: text(),
		status: productStatus().default("draft").notNull(),
		attributes: jsonb().$type<Record<string, unknown>>().default({}).notNull(),
		imageKey: text(),
		producerUrl: text(),
		// Copied from the latest snapshot, so search, filters and the card need no join.
		ingredientsText: text(),
		nutriscore: text(),
		allergens: text().array().default([]).notNull(),
		// Fields an admin corrected by hand; the Open Food Facts sync leaves them alone.
		overrides: jsonb().$type<Record<string, unknown>>().default({}).notNull(),
		offLastModifiedAt: timestamp({ withTimezone: true }),
		recipeChangedAt: timestamp({ withTimezone: true }),
		createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
		updatedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [index("idx_products_category_status").on(table.categoryId, table.status)]
);

/** What Open Food Facts said at each sync, so a changed recipe can be spotted. */
export const productSnapshots = pgTable(
	"product_snapshots",
	{
		id: uuid().defaultRandom().primaryKey(),
		productId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		ingredientsText: text(),
		allergens: text().array(),
		nutriments: jsonb().$type<Record<string, number>>(),
		nutriscore: text(),
		nova: smallint(),
		// Open Food Facts' front photo, CC-BY-SA: shown as is until a copy lives in our bucket.
		imageUrl: text(),
		fetchedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
	},
	table => [index("idx_product_snapshots_product").on(table.productId, table.fetchedAt)]
);

export const retailerLinks = pgTable(
	"retailer_links",
	{
		id: uuid().defaultRandom().primaryKey(),
		productId: uuid()
			.notNull()
			.references(() => products.id, { onDelete: "cascade" }),
		retailer: text().notNull(),
		url: text().notNull(),
		position: integer().default(0).notNull(),
	},
	table => [
		unique("retailer_links_product_retailer_key").on(table.productId, table.retailer),
	]
);
