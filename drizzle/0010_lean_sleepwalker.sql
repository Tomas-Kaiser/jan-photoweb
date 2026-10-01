CREATE TYPE "public"."proof_photo_rating" AS ENUM('rather_no', 'rather_yes');--> statement-breakpoint
ALTER TABLE "proof_photos" ADD COLUMN "rating" "proof_photo_rating";