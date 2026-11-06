import "server-only";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/**
 * Connection string, in order of preference:
 *   DATABASE_URL   set by you (Supabase "Transaction pooler" URI, port 6543)
 *   POSTGRES_URL   set by the Supabase ↔ Vercel integration (pooled)
 */
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
export const hasDatabase = Boolean(url);

type Db = PostgresJsDatabase<typeof schema>;

// One client per server instance, reused across hot reloads in development.
const globalForDb = globalThis as unknown as { ttcDb?: Db };

function create(): Db {
  const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const client = postgres(url, {
    // Supabase's transaction pooler (port 6543) does not support prepared statements.
    prepare: false,
    // One connection per process (postgres.js pipelines queries over it).
    // Builds run ~9 workers and Supabase's session pooler allows 15 clients,
    // so a bigger pool per process quickly hits "max clients reached".
    max: 1,
    idle_timeout: 20,
    ssl: local ? false : "require",
  });
  return drizzle(client, { schema });
}

/** Throws when no database is configured; check `hasDatabase` first. */
export function db(): Db {
  if (!hasDatabase) throw new Error("DATABASE_URL is not set");
  globalForDb.ttcDb ??= create();
  return globalForDb.ttcDb;
}
