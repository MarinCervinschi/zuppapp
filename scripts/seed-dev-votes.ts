// Fake votes for a local database, so the ranking, the podium and the spread bars can be
// seen before real people vote. Voters are anonymous users at @seed.invalid; running it again
// replaces their votes. Never run it against production.
import { eq, inArray, like, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { products, tags, users, voteTags, votes } from "@/db/schema";
import { refreshProductStats } from "@/lib/voting/db/product-stats";

import { assertLocalDatabase } from "./lib/local-db";

const VOTERS = 60;
const PRODUCTS = 45;

function pick<T>(list: T[], count: number): T[] {
	return [...list].sort(() => Math.random() - 0.5).slice(0, count);
}

// Each product gets a character, so the ranking has a spread: some loved, some not.
function faceFor(mean: number): number {
	return Math.min(4, Math.max(1, Math.round(mean + (Math.random() - 0.5) * 2.2)));
}

async function main() {
	assertLocalDatabase("The fake votes");
	const db = getDb();

	const voters = await db
		.insert(users)
		.values(
			Array.from({ length: VOTERS }, (_, i) => ({
				name: `Votante di prova ${i + 1}`,
				email: `voter-${i + 1}@seed.invalid`,
				isAnonymous: i % 4 !== 0,
			}))
		)
		.onConflictDoUpdate({ target: users.email, set: { updatedAt: sql`now()` } })
		.returning({ id: users.id });
	await db
		.delete(votes)
		.where(
			inArray(
				votes.userId,
				db
					.select({ id: users.id })
					.from(users)
					.where(like(users.email, "%@seed.invalid"))
			)
		);

	const published = await db
		.select({ id: products.id })
		.from(products)
		.where(eq(products.status, "published"));
	const chosen = pick(published, PRODUCTS);
	const tagRows = await db.select({ id: tags.id }).from(tags);

	for (const product of chosen) {
		const mean = 1.5 + Math.random() * 2.5;
		const count = 2 + Math.floor(Math.random() * 30);
		const rows = pick(voters, count).map(voter => ({
			userId: voter.id,
			productId: product.id,
			score: faceFor(mean),
		}));
		await db.insert(votes).values(rows);
		const tagged = rows.filter(() => Math.random() < 0.5);
		if (tagged.length > 0) {
			await db.insert(voteTags).values(
				tagged.map(row => ({
					userId: row.userId,
					productId: row.productId,
					tagId: pick(tagRows, 1)[0].id,
				}))
			);
		}
	}
	await refreshProductStats(
		db,
		published.map(p => p.id)
	);
	console.log(`Votes from ${VOTERS} test voters on ${chosen.length} products`);
	process.exit(0);
}

main().catch(error => {
	console.error(error);
	process.exit(1);
});
