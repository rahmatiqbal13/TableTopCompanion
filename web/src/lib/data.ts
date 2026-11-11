import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import seedCatalog from "@/data/seed.json";
import seedPosts from "@/data/posts.json";
import { db, hasDatabase } from "./db/client";
import * as schema from "./db/schema";
import type { Catalog, LocalListing, Post } from "./types";

export const CATALOG_TAG = "catalog";
export const POSTS_TAG = "posts";
export const LOCAL_TAG = "local";

/** The whole catalog (a few thousand rows at most), cached until an admin edit. */
export async function getCatalog(): Promise<Catalog> {
  "use cache";
  cacheTag(CATALOG_TAG);
  cacheLife("hours"); // safety net; edits normally clear it at once (admin actions, Supabase webhook)

  if (!hasDatabase) {
    return { ...(seedCatalog as Omit<Catalog, "live" | "updatedAt">), live: false, updatedAt: null };
  }
  const d = db();
  const ug = schema.userGames, pr = schema.profiles;
  const [genres, criteria, games, community, presets] = await Promise.all([
    d.select().from(schema.genres).orderBy(asc(schema.genres.name)),
    d.select().from(schema.criteria).orderBy(asc(schema.criteria.sort), asc(schema.criteria.id)),
    d.select().from(schema.games).orderBy(desc(schema.games.updatedAt)),
    d.select({ gameId: ug.gameId, rating: sql<number>`avg(${ug.rating})::float8`, votes: sql<number>`count(${ug.rating})::int` })
      .from(ug).innerJoin(pr, eq(pr.id, ug.userId))
      .where(and(sql`${ug.rating} is not null`, eq(pr.banned, false)))
      .groupBy(ug.gameId),
    d.select().from(schema.presetWeights),
  ]);
  const byGame = new Map(community.map((c) => [c.gameId, { rating: c.rating, votes: c.votes }]));
  return {
    genres,
    criteria,
    games: games.map(({ updatedAt: _u, ...g }) => ({ ...g, community: byGame.get(g.id) ?? null })),
    presetWeights: Object.fromEntries(presets.map((p) => [p.presetId, p.weights])),
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
  cacheLife("hours"); // safety net; edits normally clear it at once (admin actions, Supabase webhook)

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
  cacheLife("hours"); // safety net; edits normally clear it at once (admin actions, Supabase webhook)

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

type ListingRow = typeof schema.localListings.$inferSelect;
const toListing = (r: ListingRow): LocalListing => ({ ...r, updatedAt: r.updatedAt.toISOString() });

/** Published "Play near you" listings. Empty without a database: this directory has no seed data. */
export async function getPublishedListings(): Promise<LocalListing[]> {
  "use cache";
  cacheTag(LOCAL_TAG);
  cacheLife("hours"); // safety net; edits normally clear it at once (admin actions, Supabase webhook)

  if (!hasDatabase) return [];
  const t = schema.localListings;
  return (await db().select().from(t).where(eq(t.status, "published")).orderBy(asc(t.name))).map(toListing);
}

/** Every listing including drafts, for the admin. Not cached. */
export async function getAllListingsForAdmin(): Promise<LocalListing[]> {
  if (!hasDatabase) return [];
  return (await db().select().from(schema.localListings).orderBy(desc(schema.localListings.updatedAt))).map(toListing);
}

export interface FeedbackStats {
  total: number;
  up: number;
  /** Helpful rate by result position: is the top of the list better? */
  byRank: { bucket: string; total: number; up: number }[];
  /** Helpful rate by match %: does a higher score mean a better pick? */
  byScore: { bucket: string; total: number; up: number }[];
  games: { id: number; name: string; up: number; down: number }[];
  recent: { createdAt: string; game: string; vote: number; rank: number; score: number; query: string; lang: string }[];
}

/** Aggregates for /admin/feedback. Not cached. */
export async function getFeedbackStats(): Promise<FeedbackStats | null> {
  if (!hasDatabase) return null;
  const d = db();
  const f = schema.feedback, g = schema.games;
  const up = sql<number>`count(*) filter (where ${f.vote} = 1)::int`;
  const total = sql<number>`count(*)::int`;
  const rankBucket = sql<string>`case when ${f.rank} <= 3 then '1–3' when ${f.rank} <= 10 then '4–10' else '11+' end`;
  const scoreBucket = sql<string>`case when ${f.score} >= 0.7 then '≥ 70%' when ${f.score} >= 0.5 then '50–69%' else '< 50%' end`;
  const [[totals], byRank, byScore, games, recent] = await Promise.all([
    d.select({ total, up }).from(f),
    d.select({ bucket: rankBucket, total, up }).from(f).groupBy(rankBucket).orderBy(sql`min(${f.rank})`),
    d.select({ bucket: scoreBucket, total, up }).from(f).groupBy(scoreBucket).orderBy(sql`min(${f.score}) desc`),
    d.select({ id: g.id, name: g.name, up, down: sql<number>`count(*) filter (where ${f.vote} = -1)::int` })
      .from(f).innerJoin(g, eq(f.gameId, g.id)).groupBy(g.id, g.name).orderBy(sql`count(*) desc`).limit(30),
    d.select({ createdAt: f.createdAt, game: g.name, vote: f.vote, rank: f.rank, score: f.score, query: f.query, lang: f.lang })
      .from(f).innerJoin(g, eq(f.gameId, g.id)).orderBy(desc(f.createdAt)).limit(20),
  ]);
  return {
    total: totals.total, up: totals.up, byRank, byScore, games,
    recent: recent.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
  };
}

export interface AdminUser {
  id: string;
  email: string | null;
  name: string | null;
  role: "user" | "editor" | "admin";
  banned: boolean;
  createdAt: string;
  ratings: number;
  shelf: number;
}

/** All accounts with activity counts, newest first. Not cached. */
export async function getUsersForAdmin(): Promise<AdminUser[]> {
  if (!hasDatabase) return [];
  const p = schema.profiles, ug = schema.userGames;
  const rows = await db().select({
    id: p.id, email: p.email, name: p.displayName, role: p.role, banned: p.banned, createdAt: p.createdAt,
    ratings: sql<number>`count(${ug.rating})::int`,
    shelf: sql<number>`count(${ug.gameId})::int`,
  }).from(p).leftJoin(ug, eq(ug.userId, p.id)).groupBy(p.id).orderBy(desc(p.createdAt));
  return rows.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }));
}

export interface AdminOverview {
  games: { total: number; noImage: number; noBgg: number; noText: number };
  posts: { published: number; draftCount: number };
  listings: { drafts: number };
  users: { total: number; newThisWeek: number; ratings: number };
  feedback: { total: number; thisWeek: number; up: number; flagged: number; topGames: { name: string; votes: number }[] };
}

/** Numbers and to-dos for the admin dashboard. Not cached. */
export async function getAdminOverview(): Promise<AdminOverview | null> {
  if (!hasDatabase) return null;
  const d = db();
  const g = schema.games, p = schema.posts, pr = schema.profiles, ug = schema.userGames, f = schema.feedback;
  const week = sql`now() - interval '7 days'`;
  const votesByGame = d.select({ gameId: f.gameId, up: sql<number>`count(*) filter (where ${f.vote} = 1)::int`.as("up"), down: sql<number>`count(*) filter (where ${f.vote} = -1)::int`.as("down") })
    .from(f).groupBy(f.gameId).as("votes_by_game");
  const [[games], [posts], [listings], [users], [ratings], [feedback], [flagged], topGames] = await Promise.all([
    d.select({
      total: sql<number>`count(*)::int`,
      noImage: sql<number>`count(*) filter (where ${g.imageUrl} is null)::int`,
      noBgg: sql<number>`count(*) filter (where ${g.bggId} is null)::int`,
      noText: sql<number>`count(*) filter (where coalesce(${g.description}, '') = '')::int`,
    }).from(g),
    d.select({
      published: sql<number>`count(*) filter (where ${p.status} = 'published')::int`,
      draftCount: sql<number>`count(*) filter (where ${p.status} = 'draft')::int`,
    }).from(p),
    d.select({ drafts: sql<number>`count(*) filter (where ${schema.localListings.status} = 'draft')::int` }).from(schema.localListings),
    d.select({ total: sql<number>`count(*)::int`, newThisWeek: sql<number>`count(*) filter (where ${pr.createdAt} > ${week})::int` }).from(pr),
    d.select({ n: sql<number>`count(${ug.rating})::int` }).from(ug),
    d.select({
      total: sql<number>`count(*)::int`,
      thisWeek: sql<number>`count(*) filter (where ${f.createdAt} > ${week})::int`,
      up: sql<number>`count(*) filter (where ${f.vote} = 1)::int`,
    }).from(f),
    d.select({ n: sql<number>`count(*)::int` }).from(votesByGame).where(sql`${votesByGame.down} > ${votesByGame.up}`),
    d.select({ name: g.name, votes: sql<number>`count(*)::int` }).from(f).innerJoin(g, eq(f.gameId, g.id))
      .where(sql`${f.createdAt} > ${week}`).groupBy(g.id, g.name).orderBy(sql`count(*) desc`).limit(5),
  ]);
  return { games, posts, listings, users: { ...users, ratings: ratings.n }, feedback: { ...feedback, flagged: flagged.n, topGames } };
}
