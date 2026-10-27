import { inArray, sql } from "drizzle-orm";

import type { DbOrTx } from "@/db";

/**
 * Rebuilds the rollup of the given products from `votes`. Called inside the transaction
 * that changed their votes: a new vote, or an anonymous user's votes moving to an account.
 */
export async function refreshProductStats(db: DbOrTx, productIds: string[]) {
	if (productIds.length === 0) return;

	await db.execute(sql`
		INSERT INTO product_stats (product_id, votes_count, votes_registered, score_sum, rebuy_count, score_counts, tag_counts, updated_at)
		SELECT
			p.id,
			count(v.user_id)::int,
			count(v.user_id) FILTER (WHERE NOT u.is_anonymous)::int,
			coalesce(sum(v.score), 0)::int,
			count(v.user_id) FILTER (WHERE v.score = 5)::int,
			coalesce((
				SELECT jsonb_object_agg(c.score::text, c.n)
				FROM (
					SELECT score, count(*)::int AS n FROM votes WHERE product_id = p.id GROUP BY score
				) c
			), '{}'::jsonb),
			coalesce((
				SELECT jsonb_object_agg(t.slug, t.n)
				FROM (
					SELECT tg.slug, count(*)::int AS n
					FROM vote_tags vt JOIN tags tg ON tg.id = vt.tag_id
					WHERE vt.product_id = p.id
					GROUP BY tg.slug
				) t
			), '{}'::jsonb),
			now()
		FROM products p
		LEFT JOIN votes v ON v.product_id = p.id
		LEFT JOIN users u ON u.id = v.user_id
		WHERE ${inArray(sql`p.id`, productIds)}
		GROUP BY p.id
		ON CONFLICT (product_id) DO UPDATE SET
			votes_count = excluded.votes_count,
			votes_registered = excluded.votes_registered,
			score_sum = excluded.score_sum,
			rebuy_count = excluded.rebuy_count,
			score_counts = excluded.score_counts,
			tag_counts = excluded.tag_counts,
			updated_at = excluded.updated_at
	`);
}
