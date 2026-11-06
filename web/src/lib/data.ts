import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq } from "drizzle-orm";
import seedCatalog from "@/data/seed.json";
import seedPosts from "@/data/posts.json";
import { db, hasDatabase } from "./db/client";
import * as schema from "./db/schema";
import type { Catalog, Post } from "./types";

export const CATALOG_TAG = "catalog";
export const POSTS_TAG = "posts";

/** The whole catalog (a few thousand rows at most), cached until an admin edit. */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("days");

  if (!hasDatabase) {
    return { ...(seedCatalog as Omit<Catalog, "live" | "updatedAt">), live: false, updatedAt: null };
  }
  const d = db();
  const [genres, criteria, games] = await Promise.all([
    d.select().from(schema.genres).orderBy(asc(schema.genres.name)),
    d.select().from(schema.criteria).orderBy(asc(schema.criteria.sort), asc(schema.criteria.id)),
    d.select().from(schema.games).orderBy(desc(schema.games.updatedAt)),
  ]);
  return {
    genres,
    criteria,
    games: games.map(({ updatedAt: _u, ...g }) => g),
    live: true,
    updatedAt: games[0]?.updatedAt.toISOString() ?? null,
  };
}

type PostRow = typeof schema.posts.$inferSelect;
const toPost = (r: PostRow): Post => ({
  ...r,
  publishedAt: r.publishedAt?.toISOString() ?? null,
  updatedAt: r.updatedAt.toISOString(),
});

/** Published posts, newest first, without bodies (for listings). */
export async function getPublishedPosts(): Promise<Post[]> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("days");

  const rows: Post[] = hasDatabase
    ? (await db().select().from(schema.posts)
        .where(eq(schema.posts.status, "published"))
        .orderBy(desc(schema.posts.publishedAt))).map(toPost)
    : (seedPosts as Post[]).filter((p) => p.status === "published");
  return rows.map((p) => ({
    ...p,
    text: Object.fromEntries(Object.entries(p.text).map(([l, t]) => [l, { ...t, body: "" }])),
  }));
}

/** One published post with its body. */
export async function getPublishedPost(slug: string): Promise<Post | null> {
  "use cache";
  cacheTag(POSTS_TAG);
  cacheLife("days");

  if (!hasDatabase) return (seedPosts as Post[]).find((p) => p.slug === slug && p.status === "published") ?? null;
  const [row] = await db().select().from(schema.posts)
    .where(and(eq(schema.posts.slug, slug), eq(schema.posts.status, "published")));
  return row ? toPost(row) : null;
}

/** Every post including drafts, for the admin. Not cached. */
export async function getAllPostsForAdmin(): Promise<Post[]> {
  if (!hasDatabase) return seedPosts as Post[];
  return (await db().select().from(schema.posts).orderBy(desc(schema.posts.updatedAt))).map(toPost);
}
