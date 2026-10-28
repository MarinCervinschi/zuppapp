ALTER TABLE "product_reports" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "product_reports" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "product_reports" ADD COLUMN "quantity" text;--> statement-breakpoint
ALTER TABLE "product_reports" ADD COLUMN "photo_keys" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "product_reports" ADD COLUMN "resolved_by" uuid;--> statement-breakpoint
ALTER TABLE "product_reports" ADD COLUMN "resolved_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "product_reports" ADD CONSTRAINT "product_reports_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_reports_open_key" ON "product_reports" USING btree ("user_id","ean") WHERE "product_reports"."status" = 'open';