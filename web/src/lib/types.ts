export type CriterionType = "benefit" | "cost" | "target";

export interface Genre {
  id: number;
  name: string;
}

export interface Criterion {
  id: number;
  /** Stable identifier used in game values and URLs, e.g. "playTime". */
  key: string;
  name: string;
  unit: string;
  hint: string;
  /** Admin default weight, 0..1 (the set is re-normalized at runtime). */
  defaultWeight: number;
  /** Admin default direction. Users can override it per session. */
  type: Exclude<CriterionType, "target">;
  sort: number;
}

export interface Game {
  id: number;
  /** BoardGameGeek thing id, when the game has been matched/imported. */
  bggId: number | null;
  name: string;
  year: number;
  genreId: number;
  imageUrl: string | null;
  linkUrl: string | null;
  /** Criterion key -> raw value (minPlayers, rating, complexity, playTime, minAge, ...). */
  values: Record<string, number>;
  // ---- Optional enrichment from BGG (empty/null for legacy rows) ----
  maxPlayers: number | null;
  /** Player counts the BGG community poll marks as "Best". */
  bestPlayers: number[];
  /** Player counts marked "Recommended" (superset of best is not guaranteed). */
  recPlayers: number[];
  /** Number of BGG ratings behind values.rating. */
  votes: number | null;
  bggRank: number | null;
  categories: string[];
  mechanics: string[];
  description: string | null;
  /** Ratings from TableTop Companion users (not banned), when there are any. */
  community?: { rating: number; votes: number } | null;
}

export interface Catalog {
  genres: Genre[];
  criteria: Criterion[];
  games: Game[];
  /** False when no DATABASE_URL is set and the bundled seed data is served. */
  live: boolean;
  updatedAt: string | null;
}

export const POST_TYPES = ["news", "reviews", "videos", "guides"] as const;
export type PostType = (typeof POST_TYPES)[number];

export interface PostText {
  title: string;
  excerpt: string;
  /** Markdown. */
  body: string;
}

export interface Post {
  id: number;
  slug: string;
  type: PostType;
  status: "draft" | "published";
  publishedAt: string | null;
  coverUrl: string | null;
  /** YouTube video id (11 chars), not the URL. */
  youtubeId: string | null;
  /** Editor's score 0..10, for reviews. */
  score: number | null;
  gameIds: number[];
  /** Per-language text; at least one language is present. */
  text: { id?: PostText; en?: PostText };
  updatedAt: string;
}
