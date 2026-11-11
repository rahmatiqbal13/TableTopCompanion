CREATE TABLE "preset_weights" (
	"preset_id" varchar(40) PRIMARY KEY NOT NULL,
	"weights" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "recommended" boolean DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE "preset_weights" ENABLE ROW LEVEL SECURITY;
