CREATE TABLE "criteria" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(40) NOT NULL,
	"name" varchar(80) NOT NULL,
	"unit" varchar(20) DEFAULT '' NOT NULL,
	"hint" text DEFAULT '' NOT NULL,
	"default_weight" real NOT NULL,
	"type" varchar(10) NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL,
	CONSTRAINT "criteria_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"bgg_id" integer,
	"name" varchar(200) NOT NULL,
	"year" smallint NOT NULL,
	"genre_id" integer NOT NULL,
	"image_url" text,
	"link_url" text,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_players" smallint,
	"best_players" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rec_players" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"votes" integer,
	"bgg_rank" integer,
	"categories" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"mechanics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"description" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_bgg_id_unique" UNIQUE("bgg_id")
);
--> statement-breakpoint
CREATE TABLE "genres" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(80) NOT NULL,
	CONSTRAINT "genres_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_genre_id_genres_id_fk" FOREIGN KEY ("genre_id") REFERENCES "public"."genres"("id") ON DELETE restrict ON UPDATE no action;