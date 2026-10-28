import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { products, tags, users, voteTags, votes } from "@/db/schema";
import { soupNameFor } from "@/lib/auth/names";
import { productImageUrl } from "@/lib/catalog/image";
import { type Score, isScore } from "@/lib/ranking/rules";
import { NotFound } from "@/lib/server/errors";

import { MY_VOTES_PAGE_SIZE } from "./schemas";

export type Viewer = {
	id: string;
	isAnonymous: boolean;
	isAdmin: boolean;
	/** The public name: the chosen nickname, else the anonymous soup name. */
	displayName: string;
	hasNickname: boolean;
	/** What the Critters avatar is drawn from: the chosen seed, else the user id. */
	avatarSeed: string;
	votesCount: number;
	favoritesCount: number;
};

/**
 * The current visitor as the header and the profile need them. Read from the database, not
 * the session's cookie cache, so a new nickname or avatar shows at once.
 */
export async function getViewer(userId: string): Promise<Viewer | null> {
	const [row] = await getDb()
		.select({
			id: users.id,
			name: users.name,
			isAnonymous: users.isAnonymous,
			nickname: users.nickname,
			avatarSeed: users.avatarSeed,
			role: users.role,
			votesCount: sql<number>`(select count(*)::int from votes where votes.user_id = ${users.id})`,
			favoritesCount: sql<number>`(select count(*)::int from favorites where favorites.user_id = ${users.id})`,
		})
		.from(users)
		.where(eq(users.id, userId));
	if (!row) return null;

	return {
		id: row.id,
		isAnonymous: row.isAnonymous,
		isAdmin: row.role === "admin" && !row.isAnonymous,
		// An anonymous voter's name was generated at sign-in ("Ribollita Anonimo #7277"); a Google
		// account's real name is never shown, so until a nickname is chosen it gets a soup name too.
		displayName: row.nickname ?? (row.isAnonymous ? row.name : soupNameFor(row.id)),
		hasNickname: Boolean(row.nickname),
		avatarSeed: row.avatarSeed || row.id,
		votesCount: row.votesCount,
		favoritesCount: row.favoritesCount,
	};
}

export async function setNickname(userId: string, nickname: string) {
	await getDb()
		.update(users)
		.set({ nickname, updatedAt: sql`now()` })
		.where(eq(users.id, userId));
}

export async function setAvatarSeed(userId: string, seed: string) {
	await getDb()
		.update(users)
		.set({ avatarSeed: seed, updatedAt: sql`now()` })
		.where(eq(users.id, userId));
}

export type MyVote = {
	productId: string;
	ean: string;
	name: string;
	brand: string | null;
	imageUrl: string | null;
	score: Score;
	tags: { label: string; sentiment: "positive" | "negative" | "neutral" }[];
	votedAt: string;
};

export type MyVotesPage = {
	items: MyVote[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
};

/** The reader's votes, most recent first, with their tags: "Le mie zuppe". */
export async function getMyVotes(userId: string, page = 1): Promise<MyVotesPage> {
	const db = getDb();
	const offset = (page - 1) * MY_VOTES_PAGE_SIZE;

	const [rows, [{ total }]] = await Promise.all([
		db
			.select({
				productId: products.id,
				ean: products.ean,
				name: products.name,
				brand: products.brand,
				imageKey: products.imageKey,
				offImageUrl: sql<string | null>`(
					select image_url from product_snapshots s where s.product_id = ${products.id}
					order by s.fetched_at desc limit 1
				)`,
				score: votes.score,
				votedAt: votes.updatedAt,
			})
			.from(votes)
			.innerJoin(products, eq(products.id, votes.productId))
			.where(eq(votes.userId, userId))
			.orderBy(desc(votes.updatedAt))
			.limit(MY_VOTES_PAGE_SIZE)
			.offset(offset),
		db
			.select({ total: sql<number>`count(*)::int` })
			.from(votes)
			.where(eq(votes.userId, userId)),
	]);
	if (page > 1 && rows.length === 0 && total > 0)
		throw new NotFound("Questa pagina dei tuoi voti non c’è.");

	const tagRows = rows.length
		? await db
				.select({
					productId: voteTags.productId,
					label: tags.label,
					sentiment: tags.sentiment,
				})
				.from(voteTags)
				.innerJoin(tags, eq(tags.id, voteTags.tagId))
				.where(
					sql`${voteTags.userId} = ${userId} AND ${voteTags.productId} IN (${sql.join(
						rows.map(r => sql`${r.productId}`),
						sql`, `
					)})`
				)
		: [];

	return {
		items: rows.flatMap(row =>
			isScore(row.score)
				? [
						{
							productId: row.productId,
							ean: row.ean,
							name: row.name,
							brand: row.brand,
							imageUrl: productImageUrl(row.imageKey) ?? row.offImageUrl,
							score: row.score,
							tags: tagRows
								.filter(tag => tag.productId === row.productId)
								.map(({ label, sentiment }) => ({ label, sentiment })),
							votedAt: row.votedAt.toISOString(),
						},
					]
				: []
		),
		total,
		page,
		pageSize: MY_VOTES_PAGE_SIZE,
		pageCount: Math.max(1, Math.ceil(total / MY_VOTES_PAGE_SIZE)),
	};
}
