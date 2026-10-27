ALTER TABLE "votes" DROP CONSTRAINT "votes_score_range";--> statement-breakpoint
-- From four faces to five stars: Buona becomes 4 stars and La ricompro 5, so no old vote lands on 3.
UPDATE "votes" SET "score" = CASE "score" WHEN 3 THEN 4 WHEN 4 THEN 5 ELSE "score" END;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_score_range" CHECK ("votes"."score" between 1 and 5);--> statement-breakpoint
-- The rollup follows: the same sums refreshProductStats writes, for every product with stats.
UPDATE "product_stats" ps SET
	"score_sum" = coalesce(v.score_sum, 0),
	"rebuy_count" = coalesce(v.rebuy_count, 0),
	"score_counts" = coalesce(v.score_counts, '{}'::jsonb),
	"updated_at" = now()
FROM (
	SELECT p.id AS product_id,
		(SELECT sum(score)::int FROM votes WHERE product_id = p.id) AS score_sum,
		(SELECT count(*)::int FROM votes WHERE product_id = p.id AND score = 5) AS rebuy_count,
		(SELECT jsonb_object_agg(c.score::text, c.n) FROM (
			SELECT score, count(*)::int AS n FROM votes WHERE product_id = p.id GROUP BY score
		) c) AS score_counts
	FROM products p
) v
WHERE v.product_id = ps.product_id;
