CREATE TABLE "final_photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"r2_key" text NOT NULL,
	"file_name" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"preview_cloudflare_id" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proof_galleries" ADD COLUMN "finals_published_at" timestamp;--> statement-breakpoint
ALTER TABLE "final_photos" ADD CONSTRAINT "final_photos_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."proof_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "final_photos_gallery_id_idx" ON "final_photos" USING btree ("gallery_id");--> statement-breakpoint
CREATE INDEX "final_photos_gallery_sort_order_idx" ON "final_photos" USING btree ("gallery_id","sort_order");