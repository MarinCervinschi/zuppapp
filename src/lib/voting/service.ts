import { and, eq, inArray, sql } from "drizzle-orm";

import { type DbOrTx, getDb } from "@/db";
import { products, tags, voteTags, votes } from "@/db/schema";
import { Invalid, NotFound } from "@/lib/server/errors";
import { clientIp, hit } from "@/lib/server/rate-limit";

import { refreshProductStats } from "./db/product-stats";

const VOTES_PER_HOUR = 60;
const HOUR_MS = 60 * 60 * 1000;

/** One vote per voter and product: voting again replaces the score and the tags. */
export async function castVote(
	userId: string,
	input: { productId: string; score: number; tagIds: string[] }
) {
	hit(`vote:${clientIp()}`, VOTES_PER_HOUR, HOUR_MS);
	const tagIds = [...new Set(input.tagIds)];

	await getDb().transaction(async tx => {
		const [product] = await tx
			.select({ status: products.status })
			.from(products)
			.where(eq(products.id, input.productId));
		if (!product || product.status === "draft")
			throw new NotFound("Prodotto non trovato");

		if (tagIds.length > 0) {
			const known = await tx
				.select({ id: tags.id })
				.from(tags)
				.where(and(inArray(tags.id, tagIds), eq(tags.active, true)));
			if (known.length !== tagIds.length) throw new Invalid("Tag non valido");
		}

		await tx
			.insert(votes)
			.values({ userId, productId: input.productId, score: input.score })
			.onConflictDoUpdate({
				target: [votes.userId, votes.productId],
				set: { score: input.score, updatedAt: sql`now()` },
			});
		await tx
			.delete(voteTags)
			.where(and(eq(voteTags.userId, userId), eq(voteTags.productId, input.productId)));
		if (tagIds.length > 0) {
			await tx
				.insert(voteTags)
				.values(tagIds.map(tagId => ({ userId, productId: input.productId, tagId })));
		}

		await refreshProductStats(tx, [input.productId]);
	});
}

export async function removeVote(userId: string, productId: string) {
	await getDb().transaction(async tx => {
		await tx
			.delete(votes)
			.where(and(eq(votes.userId, userId), eq(votes.productId, productId)));
		await refreshProductStats(tx, [productId]);
	});
}

/**
 * Moves an anonymous user's votes to the account it just signed in with. Where both voted
 * the same product the account's vote wins, since it is the one the person chose knowingly.
 */
export async function moveVotes(db: DbOrTx, fromUserId: string, toUserId: string) {
	await db.transaction(async tx => {
		const moved = await tx
			.select({ productId: votes.productId })
			.from(votes)
			.where(eq(votes.userId, fromUserId));
		if (moved.length === 0) return;

		await tx
			.delete(votes)
			.where(
				and(
					eq(votes.userId, fromUserId),
					inArray(
						votes.productId,
						tx
							.select({ productId: votes.productId })
							.from(votes)
							.where(eq(votes.userId, toUserId))
					)
				)
			);
		await tx
			.update(votes)
			.set({ userId: toUserId, updatedAt: sql`now()` })
			.where(eq(votes.userId, fromUserId));

		await refreshProductStats(
			tx,
			moved.map(row => row.productId)
		);
	});
}
