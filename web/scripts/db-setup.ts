// Creates/updates the schema and seeds an empty database.
//   npm run db:setup              migrate + seed if there are no games yet
//   npm run db:setup -- --reseed  upsert every seed game (keeps admin-added games)
//
// Uses, in order: POSTGRES_URL_NON_POOLING (Supabase direct/session connection,
// best for migrations), DATABASE_URL, POSTGRES_URL.
import { readFileSync } from "node:fs";
import { count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "../src/lib/db/schema";
import { seed, type SeedData } from "../src/lib/db/seed";

const url = process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error("No database URL. Set DATABASE_URL in .env.local (Supabase → Connect → connection string), then rerun.");
  process.exit(1);
}

const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
const client = postgres(url, { prepare: false, max: 1, ssl: local ? false : "require", onnotice: () => {} });
const db = drizzle(client, { schema });
await migrate(db, { migrationsFolder: "./drizzle" });
console.log(`✓ schema up to date (${new URL(url).hostname})`);

try {
  const data: SeedData = JSON.parse(readFileSync(new URL("../src/data/seed.json", import.meta.url), "utf8"));
  const [{ n }] = await db.select({ n: count() }).from(schema.games);
  if (n === 0 || process.argv.includes("--reseed")) {
    if (n > 0) {
      // Upsert seed games so enriched data from `npm run bgg:import` lands on existing rows.
      for (const g of data.games) {
        const { id: _id, ...rest } = g;
        await db.insert(schema.games).values(g).onConflictDoUpdate({ target: schema.games.id, set: { ...rest, updatedAt: sql`now()` } });
      }
    }
    await seed(db, data);
    console.log(`✓ seeded ${data.games.length} games`);
  } else {
    console.log(`• ${n} games already present, skipping seed (use --reseed to upsert seed data)`);
  }

  const [{ p }] = await db.select({ p: count() }).from(schema.posts);
  if (p === 0) {
    const posts = JSON.parse(readFileSync(new URL("../src/data/posts.json", import.meta.url), "utf8"));
    await db.insert(schema.posts).values(
      posts.map(({ id: _id, publishedAt, updatedAt: _u, ...rest }: Record<string, unknown>) => ({
        ...rest, publishedAt: publishedAt ? new Date(publishedAt as string) : null,
      })),
    );
    console.log(`✓ seeded ${posts.length} welcome post(s)`);
  }
} finally {
  await client.end();
}
