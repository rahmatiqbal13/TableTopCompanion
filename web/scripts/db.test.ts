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

  // Feedback: one vote per (session, game); voting again updates it.
  const sid = "6f1c6a9e-2b4d-4c55-9a51-1f2e3d4c5b6a";
  const vote = (v: number) => db.insert(schema.feedback)
    .values({ sessionId: sid, gameId: created.id, vote: v, rank: 1, score: 0.8, query: "", lang: "id" })
    .onConflictDoUpdate({ target: [schema.feedback.sessionId, schema.feedback.gameId], set: { vote: v } });
  await vote(1);
  await vote(-1);
  const rows = await db.select().from(schema.feedback);
  expect(rows).toHaveLength(1);
  expect(rows[0].vote).toBe(-1);
  await db.delete(schema.games).where(eq(schema.games.id, created.id));
  expect(await db.select().from(schema.feedback)).toHaveLength(0); // cascades with the game

  // Accounts: one row per (user, game); removing a profile removes their shelf.
  const uid = "0b6c7a3e-9a1d-4c2e-8f3b-5d6e7f8a9b0c";
  await db.insert(schema.profiles).values({ id: uid, email: "a@example.com" });
  await db.insert(schema.userGames).values({ userId: uid, gameId: sushi.id, rating: 9, played: true });
  await db.insert(schema.userGames).values({ userId: uid, gameId: sushi.id, rating: 7 })
    .onConflictDoUpdate({ target: [schema.userGames.userId, schema.userGames.gameId], set: { rating: 7 } });
  const shelf = await db.select().from(schema.userGames);
  expect(shelf).toHaveLength(1);
  expect(shelf[0]).toMatchObject({ rating: 7, played: true });
  await db.delete(schema.profiles).where(eq(schema.profiles.id, uid));
  expect(await db.select().from(schema.userGames)).toHaveLength(0);
});
