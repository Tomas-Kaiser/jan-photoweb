CREATE TYPE "public"."gallery_client_role" AS ENUM('owner', 'guest');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"locale" text NOT NULL,
	"marketing_consent_at" timestamp,
	"marketing_consent_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"locale" text NOT NULL,
	"marketing_consent_version" text,
	"code_hash" text NOT NULL,
	"link_token_hash" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"consumed_at" timestamp,
	"attempts" integer DEFAULT 0 NOT NULL,
	"send_count" integer DEFAULT 1 NOT NULL,
	"last_sent_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gallery_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"role" "gallery_client_role" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "proof_galleries" ADD COLUMN "requires_registration" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "email_verifications" ADD CONSTRAINT "email_verifications_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."proof_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_clients" ADD CONSTRAINT "gallery_clients_gallery_id_fkey" FOREIGN KEY ("gallery_id") REFERENCES "public"."proof_galleries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_clients" ADD CONSTRAINT "gallery_clients_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_email_unique" ON "clients" USING btree ("email");--> statement-breakpoint
CREATE INDEX "email_verifications_gallery_email_idx" ON "email_verifications" USING btree ("gallery_id","email");--> statement-breakpoint
CREATE INDEX "email_verifications_gallery_created_at_idx" ON "email_verifications" USING btree ("gallery_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_clients_gallery_client_unique" ON "gallery_clients" USING btree ("gallery_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_clients_one_owner_unique" ON "gallery_clients" USING btree ("gallery_id") WHERE "gallery_clients"."role" = 'owner';--> statement-breakpoint
CREATE INDEX "gallery_clients_client_id_idx" ON "gallery_clients" USING btree ("client_id");