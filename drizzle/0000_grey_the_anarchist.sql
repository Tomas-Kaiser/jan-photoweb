CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"path" text NOT NULL,
	"cover_url" text NOT NULL,
	"object_position" text DEFAULT 'center' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"name" text,
	"cloudflare_url" text NOT NULL,
	"cloudflare_id" text,
	"object_position" text DEFAULT 'center' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "albums_path_unique" ON "albums" USING btree ("path");--> statement-breakpoint
CREATE UNIQUE INDEX "albums_parent_slug_unique" ON "albums" USING btree ("parent_id","slug");--> statement-breakpoint
CREATE INDEX "albums_parent_id_idx" ON "albums" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "albums_sort_order_idx" ON "albums" USING btree ("sort_order");--> statement-breakpoint
CREATE INDEX "photos_album_id_idx" ON "photos" USING btree ("album_id");--> statement-breakpoint
CREATE INDEX "photos_sort_order_idx" ON "photos" USING btree ("sort_order");