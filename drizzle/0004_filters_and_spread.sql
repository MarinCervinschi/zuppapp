ALTER TABLE "products" ADD COLUMN "nutriscore" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "allergens" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_stats" ADD COLUMN "score_counts" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
-- Backfill from what is already here: the latest snapshot of each product, and its votes.
UPDATE products p SET nutriscore = s.nutriscore, allergens = coalesce(s.allergens, '{}')
FROM (
	SELECT DISTINCT ON (product_id) product_id, nutriscore, allergens
	FROM product_snapshots ORDER BY product_id, fetched_at DESC
) s
WHERE s.product_id = p.id;
--> statement-breakpoint
UPDATE product_stats ps SET score_counts = coalesce((
	SELECT jsonb_object_agg(score::text, n)
	FROM (SELECT score, count(*)::int AS n FROM votes v WHERE v.product_id = ps.product_id GROUP BY score) c
), '{}'::jsonb);
