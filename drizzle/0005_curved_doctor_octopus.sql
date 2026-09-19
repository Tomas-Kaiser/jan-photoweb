CREATE TYPE "public"."proof_gallery_status" AS ENUM('draft', 'active', 'submitted', 'paid', 'closed');--> statement-breakpoint
CREATE TABLE "proof_galleries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"client_name" text NOT NULL,
	"free_photo_count" integer DEFAULT 10 NOT NULL,
	"extra_photo_price_cents" integer DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'CZK' NOT NULL,
	"status" "proof_gallery_status" DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "proof_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"cloudflare_id" text NOT NULL,
	"file_name" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"selected" boolean DEFAULT false NOT NULL,
	"selected_at" timestamp,
	"comment" text
);
--> statement-breakpoint
ALTER TABLE "proof_photos" ADD CONSTRAINT "proof_photos_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."proof_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "proof_galleries_token_unique" ON "proof_galleries" USING btree ("token");--> statement-breakpoint
CREATE INDEX "proof_photos_gallery_id_idx" ON "proof_photos" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "proof_photos_gallery_sort_order_idx" ON "proof_photos" USING btree ("gallery_id","sort_order");