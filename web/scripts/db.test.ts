// Runs the real migration + seed against in-process Postgres (PGlite).
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { count, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { expect, it } from "vitest";
import * as schema from "../src/lib/db/schema";
import { seed } from "../src/lib/db/seed";

it("migrates, seeds, and keeps sequences usable", async () => {
  const db = drizzle(new PGlite(), { schema });
  await migrate(db, { migrationsFolder: "./drizzle" });
  const data = JSON.parse(readFileSync("src/data/seed.json", "utf8"));
  await seed(db, data);
  await seed(db, data); // idempotent
  const [{ n }] = await db.select({ n: count() }).from(schema.games);
  expect(n).toBe(140);
  const [created] = await db.insert(schema.games)
    .values({ name: "New", year: 2024, genreId: 1, values: { rating: 7 } })
    .returning();
  expect(created.id).toBe(141);
  const [sushi] = await db.select().from(schema.games).where(eq(schema.games.name, "Sushi Go!"));
  expect(sushi.values.complexity).toBeCloseTo(1.17);
  expect(sushi.bestPlayers).toEqual([]);

  const [post] = await db.insert(schema.posts).values({
    slug: "ulasan-sushi-go", type: "reviews", status: "published", publishedAt: new Date(), youtubeId: "dQw4w9WgXcQ",
    score: 8.5, gameIds: [sushi.id], text: { id: { title: "Ulasan", excerpt: "", body: "## Hai" } },
  }).returning();
  expect(post.text.id?.title).toBe("Ulasan");
  expect(post.text.en).toBeUndefined();
  await expect(db.insert(schema.posts).values({ slug: "ulasan-sushi-go", type: "news", text: {} })).rejects.toThrow();
});
