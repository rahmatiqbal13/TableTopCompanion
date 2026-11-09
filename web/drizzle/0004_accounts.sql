CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"email" text,
	"display_name" varchar(80),
	"avatar_url" text,
	"role" varchar(10) DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_games" (
	"user_id" uuid NOT NULL,
	"game_id" integer NOT NULL,
	"rating" smallint,
	"played" boolean DEFAULT false NOT NULL,
	"own" boolean DEFAULT false NOT NULL,
	"wishlist" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_games_user_id_game_id_pk" PRIMARY KEY("user_id","game_id")
);
--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_games" ADD CONSTRAINT "user_games_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "user_games_game_idx" ON "user_games" USING btree ("game_id");--> statement-breakpoint
-- See 0002_enable_rls.sql: keep the Supabase REST API closed for these tables too.
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_games" ENABLE ROW LEVEL SECURITY;
