CREATE TYPE "public"."photo_visibility" AS ENUM('public', 'highlights_only');--> statement-breakpoint
CREATE TABLE "portfolio_highlights" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"photo_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "photos" ADD COLUMN "visibility" "photo_visibility" DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE "portfolio_highlights" ADD CONSTRAINT "portfolio_highlights_photo_id_fkey" FOREIGN KEY ("photo_id") REFERENCES "public"."photos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_highlights_photo_id_unique" ON "portfolio_highlights" USING btree ("photo_id");--> statement-breakpoint
CREATE INDEX "portfolio_highlights_sort_order_idx" ON "portfolio_highlights" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "photos_visibility_idx" ON "photos" USING btree ("visibility");