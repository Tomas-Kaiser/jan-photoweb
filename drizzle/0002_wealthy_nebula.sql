ALTER TABLE "photos" ALTER COLUMN "cloudflare_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "albums" DROP COLUMN "cover_url";--> statement-breakpoint
ALTER TABLE "photos" DROP COLUMN "cloudflare_url";