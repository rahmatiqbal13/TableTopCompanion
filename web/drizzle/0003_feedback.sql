CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" varchar(36) NOT NULL,
	"game_id" integer NOT NULL,
	"vote" smallint NOT NULL,
	"rank" smallint NOT NULL,
	"score" real NOT NULL,
	"query" text DEFAULT '' NOT NULL,
	"lang" varchar(2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feedback_session_game_idx" ON "feedback" USING btree ("session_id","game_id");--> statement-breakpoint
CREATE INDEX "feedback_created_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
-- See 0002_enable_rls.sql: keep the Supabase REST API closed for this table too.
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
