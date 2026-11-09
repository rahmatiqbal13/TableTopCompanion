CREATE TABLE "local_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"kind" varchar(12) NOT NULL,
	"status" varchar(10) DEFAULT 'draft' NOT NULL,
	"name" varchar(160) NOT NULL,
	"city" varchar(80) DEFAULT '' NOT NULL,
	"address" text,
	"map_url" text,
	"website_url" text,
	"instagram_url" text,
	"contact" varchar(120),
	"image_url" text,
	"designer" varchar(120),
	"game_id" integer,
	"text" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "local_listings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "tiktok_id" varchar(32);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "video_format" varchar(5) DEFAULT 'long' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "duration_sec" integer;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "review_source" varchar(12);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "subscores" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "local_listings" ADD CONSTRAINT "local_listings_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "local_listings_kind_status_idx" ON "local_listings" USING btree ("kind","status");--> statement-breakpoint
-- See 0002_enable_rls.sql: keep the Supabase REST API closed for this table too.
ALTER TABLE "local_listings" ENABLE ROW LEVEL SECURITY;
