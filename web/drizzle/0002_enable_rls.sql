-- Supabase exposes the public schema through its REST API (PostgREST).
-- The app connects directly as the table owner, which bypasses RLS, so enabling
-- RLS without any policies locks the REST API out while the app keeps working.
-- On other Postgres hosts this is harmless.
ALTER TABLE "genres" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "criteria" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "games" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
