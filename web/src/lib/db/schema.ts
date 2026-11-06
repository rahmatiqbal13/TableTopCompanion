import { index, integer, jsonb, pgTable, real, serial, smallint, text, timestamp, varchar } from "drizzle-orm/pg-core";
import type { Post } from "../types";

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
    score: real("score"),
    gameIds: jsonb("game_ids").$type<number[]>().notNull().default([]),
    text: jsonb("text").$type<Post["text"]>().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("posts_status_published_idx").on(t.status, t.publishedAt)],
);
