ALTER TABLE "proof_galleries" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "proof_galleries" DROP COLUMN "expires_at";--> statement-breakpoint
DROP TYPE "public"."proof_gallery_status";