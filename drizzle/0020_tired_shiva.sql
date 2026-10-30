CREATE TYPE "public"."registration_purpose" AS ENUM('owner', 'guest');--> statement-breakpoint
ALTER TABLE "email_verifications" ADD COLUMN "purpose" "registration_purpose" DEFAULT 'owner' NOT NULL;