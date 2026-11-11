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
  /** False: stays in the catalog but is never recommended. Absent counts as true. */
  recommended?: boolean;
  /** Ratings from TableTop Companion users (not banned), when there are any. */
  community?: { rating: number; votes: number } | null;
}

export interface Catalog {
  genres: Genre[];
  criteria: Criterion[];
  games: Game[];
  /** Admin-tuned importances per mood preset: preset id -> criterion key -> 0..10. */
  presetWeights?: Record<string, Record<string, number>>;
  /** False when no DATABASE_URL is set and the bundled seed data is served. */
  live: boolean;
  updatedAt: string | null;
}

export const POST_TYPES = ["news", "reviews", "videos", "guides"] as const;
export type PostType = (typeof POST_TYPES)[number];

export const VIDEO_FORMATS = ["long", "short"] as const;
export type VideoFormat = (typeof VIDEO_FORMATS)[number];

export const REVIEW_SOURCES = ["bought", "publisher", "borrowed"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

export const SUBSCORE_KEYS = ["teach", "interaction", "replay"] as const;
/** 0..10 per aspect; a key is missing when the editor left it blank. */
export type SubScores = Partial<Record<(typeof SUBSCORE_KEYS)[number], number>>;

export interface PostText {
  title: string;
  excerpt: string;
  /** Markdown. */
  body: string;
  /** Reviews: who the game is great for. */
  forWho?: string;
  /** Reviews: who should pass. */
  skip?: string;
  /** Estimated reading time; set on list payloads, where the body is dropped. */
  readMinutes?: number;
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
  /** TikTok video id (digits), not the URL. A post has at most one video. */
  tiktokId: string | null;
  videoFormat: VideoFormat;
  durationSec: number | null;
  /** Editor's score 0..10, for reviews. */
  score: number | null;
  /** How the reviewer got the copy, for reviews. */
  reviewSource: ReviewSource | null;
  subscores: SubScores;
  gameIds: number[];
  /** Per-language text; at least one language is present. */
  text: { id?: PostText; en?: PostText };
  updatedAt: string;
}

/** Doubles as the URL segment: /local/cafes, /local/communities, /local/games. */
export const LOCAL_KINDS = ["cafes", "communities", "games"] as const;
export type LocalKind = (typeof LOCAL_KINDS)[number];
export const isLocalKind = (x: string): x is LocalKind => (LOCAL_KINDS as readonly string[]).includes(x);

export interface LocalText {
  summary: string;
  schedule: string;
  /** Markdown. */
  body: string;
}

/** A café, community or Indonesian-made game in the "Play near you" directory. */
export interface LocalListing {
  id: number;
  slug: string;
  kind: LocalKind;
  status: "draft" | "published";
  name: string;
  city: string;
  address: string | null;
  mapUrl: string | null;
  websiteUrl: string | null;
  instagramUrl: string | null;
  contact: string | null;
  imageUrl: string | null;
  designer: string | null;
  gameId: number | null;
  text: { id?: LocalText; en?: LocalText };
  updatedAt: string;
}
