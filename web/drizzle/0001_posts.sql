CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(120) NOT NULL,
	"type" varchar(10) NOT NULL,
	"status" varchar(10) DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"cover_url" text,
	"youtube_id" varchar(11),
	"score" real,
	"game_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"text" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "posts_status_published_idx" ON "posts" USING btree ("status","published_at");