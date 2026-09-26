CREATE TYPE "public"."proof_order_status" AS ENUM('pending_payment', 'paid');--> statement-breakpoint
CREATE TABLE "proof_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"selected_photo_ids" jsonb NOT NULL,
	"included_count" integer NOT NULL,
	"extra_count" integer NOT NULL,
	"total_cents" integer NOT NULL,
	"status" "proof_order_status" DEFAULT 'pending_payment' NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "proof_orders" ADD CONSTRAINT "proof_orders_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."proof_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "proof_orders_gallery_id_unique" ON "proof_orders" USING btree ("gallery_id");