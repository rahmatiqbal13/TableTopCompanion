import { boolean, index, integer, primaryKey, uniqueIndex, uuid, jsonb, pgTable, real, serial, smallint, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { LOCAL_KINDS, REVIEW_SOURCES, VIDEO_FORMATS, type LocalListing, type Post, type SubScores } from "../types";

export const genres = pgTable("genres", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 80 }).notNull().unique(),
});

export const criteria = pgTable("criteria", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  unit: varchar("unit", { length: 20 }).notNull().default(""),
  hint: text("hint").notNull().default(""),
  defaultWeight: real("default_weight").notNull(),
  type: varchar("type", { length: 10, enum: ["benefit", "cost"] }).notNull(),
  sort: smallint("sort").notNull().default(0),
});

export const games = pgTable("games", {
  id: serial("id").primaryKey(),
  bggId: integer("bgg_id").unique(),
  name: varchar("name", { length: 200 }).notNull(),
  year: smallint("year").notNull(),
  genreId: integer("genre_id").notNull().references(() => genres.id, { onDelete: "restrict" }),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  /** Criterion key -> value. */
  values: jsonb("values").$type<Record<string, number>>().notNull().default({}),
  maxPlayers: smallint("max_players"),
  bestPlayers: jsonb("best_players").$type<number[]>().notNull().default([]),
  recPlayers: jsonb("rec_players").$type<number[]>().notNull().default([]),
  votes: integer("votes"),
  bggRank: integer("bgg_rank"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  mechanics: jsonb("mechanics").$type<string[]>().notNull().default([]),
  description: text("description"),
  /** False keeps the game in the catalog but out of recommendations. */
  recommended: boolean("recommended").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Admin-tuned importances (criterion key -> 0..10) for a recommender mood preset. */
export const presetWeights = pgTable("preset_weights", {
  presetId: varchar("preset_id", { length: 40 }).primaryKey(),
  weights: jsonb("weights").$type<Record<string, number>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const posts = pgTable(
  "posts",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    type: varchar("type", { length: 10, enum: ["news", "reviews", "videos", "guides"] }).notNull(),
    status: varchar("status", { length: 10, enum: ["draft", "published"] }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    coverUrl: text("cover_url"),
    youtubeId: varchar("youtube_id", { length: 11 }),
    tiktokId: varchar("tiktok_id", { length: 32 }),
    videoFormat: varchar("video_format", { length: 5, enum: VIDEO_FORMATS }).notNull().default("long"),
    durationSec: integer("duration_sec"),
    score: real("score"),
    reviewSource: varchar("review_source", { length: 12, enum: REVIEW_SOURCES }),
    subscores: jsonb("subscores").$type<SubScores>().notNull().default({}),
    gameIds: jsonb("game_ids").$type<number[]>().notNull().default([]),
    text: jsonb("text").$type<Post["text"]>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_status_published_idx").on(t.status, t.publishedAt)],
);

/**
 * Anonymous 👍/👎 on recommendations. One row per (browser session, game);
 * voting again updates it. `query` holds the recommender URL parameters so a
 * vote can be reproduced and compared across ranking methods.
 */
export const feedback = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    sessionId: varchar("session_id", { length: 36 }).notNull(),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    vote: smallint("vote").notNull(),
    rank: smallint("rank").notNull(),
    score: real("score").notNull(),
    query: text("query").notNull().default(""),
    lang: varchar("lang", { length: 2 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("feedback_session_game_idx").on(t.sessionId, t.gameId), index("feedback_created_idx").on(t.createdAt)],
);

/**
 * One row per Supabase Auth user (id = auth.users.id). Created on first sign-in.
 * Email is kept for the admin users page and ADMIN_EMAILS; never shown publicly.
 */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  displayName: varchar("display_name", { length: 80 }),
  avatarUrl: text("avatar_url"),
  role: varchar("role", { length: 10, enum: ["user", "editor", "admin"] }).notNull().default("user"),
  banned: boolean("banned").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** A user's relation to a game: rating 1..10 and shelf flags. Row removed when all empty. */
export const userGames = pgTable(
  "user_games",
  {
    userId: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    gameId: integer("game_id").notNull().references(() => games.id, { onDelete: "cascade" }),
    rating: smallint("rating"),
    played: boolean("played").notNull().default(false),
    own: boolean("own").notNull().default(false),
    wishlist: boolean("wishlist").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.gameId] }), index("user_games_game_idx").on(t.gameId)],
);

/** "Play near you": cafés, communities and Indonesian-made games, managed in /admin/local. */
export const localListings = pgTable(
  "local_listings",
  {
    id: serial("id").primaryKey(),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    kind: varchar("kind", { length: 12, enum: LOCAL_KINDS }).notNull(),
    status: varchar("status", { length: 10, enum: ["draft", "published"] }).notNull().default("draft"),
    name: varchar("name", { length: 160 }).notNull(),
    city: varchar("city", { length: 80 }).notNull().default(""),
    address: text("address"),
    mapUrl: text("map_url"),
    websiteUrl: text("website_url"),
    instagramUrl: text("instagram_url"),
    contact: varchar("contact", { length: 120 }),
    imageUrl: text("image_url"),
    designer: varchar("designer", { length: 120 }),
    gameId: integer("game_id").references(() => games.id, { onDelete: "set null" }),
    text: jsonb("text").$type<LocalListing["text"]>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("local_listings_kind_status_idx").on(t.kind, t.status)],
);
