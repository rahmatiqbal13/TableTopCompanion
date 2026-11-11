import { buildSimilarityIndex, type SimilarityIndex } from "./similarity";
import { topsisAbsolute, type AbsoluteTopsisResult } from "./topsis";
import type { Catalog, Criterion, CriterionType, Game } from "./types";

/*
 * Hybrid TOPSIS recommender
 * -------------------------
 * 1. Constraints. Hard ones remove games that cannot work tonight (group size,
 *    genre, year, far over the time limit or age). Soft ones keep games that
 *    are only slightly over the time limit or recommended age, with a penalty.
 * 2. Criteria are built per candidate:
 *      - catalog criteria (rating, complexity, play time, ...); the rating is
 *        replaced by a Bayesian average when vote counts are known, so a
 *        9.0 from 30 votes does not beat an 8.0 from 50 000 votes;
 *      - "Player-count fit" (derived, needs a group size): how well the game
 *        plays at exactly that count, from BGG's "best with" poll;
 *      - "Taste match" (derived, needs favourites): content similarity to
 *        the games the user already loves.
 * 3. Each value becomes a utility in 0..1 on a fixed, catalog-wide scale and
 *    TOPSIS measures closeness to the absolute ideal (all 1s). Scores do not
 *    depend on which other games are in the list (no rank reversal).
 * 4. Optional "Mix it up": near-identical games are folded under the
 *    higher-ranked one ("Similar: …"), so the list shows more variety while
 *    staying strictly in score order.
 */

export interface CriterionPref {
  /** 0..10; 0 switches the criterion off. */
  importance: number;
  type: CriterionType;
  target?: number;
}

export interface Preferences {
  groupSize: number | null;
  youngestAge: number | null;
  maxTime: number | null;
  genres: number[];
  yearFrom: number | null;
  yearTo: number | null;
  /** Game ids the user loves; drives the taste criterion. */
  favourites: number[];
  diversify: boolean;
  criteria: Record<string, CriterionPref>;
}

export const PLAYER_FIT = "playerFit";
export const TASTE = "taste";

/** Criteria computed per request rather than stored per game. */
export const DERIVED: Criterion[] = [
  {
    id: -1, key: PLAYER_FIT, name: "Player-count fit", unit: "", sort: 100,
    hint: "How well it plays with exactly your group size (BGG community poll)",
    defaultWeight: 0.25, type: "benefit",
  },
  {
    id: -2, key: TASTE, name: "Taste match", unit: "", sort: 101,
    hint: "Similarity to the games you picked as favourites",
    defaultWeight: 0.35, type: "benefit",
  },
];

export interface Preset {
  id: string;
  label: string;
  description: string;
  /** `weights` are the admin's saved importances for this preset, when there are any. */
  criteria: (criteria: Criterion[], weights?: Record<string, number>) => Record<string, CriterionPref>;
}

export function adminDefaults(criteria: Criterion[]): Record<string, CriterionPref> {
  return Object.fromEntries(
    [...criteria, ...DERIVED].map((c) => [c.key, { importance: Math.round(c.defaultWeight * 20), type: c.type }]),
  );
}

/** Known criterion keys get tuned values; unknown (admin-added) keys keep defaults. */
function tuned(overrides: Record<string, CriterionPref>): Preset["criteria"] {
  return (criteria, weights) => {
    const base = adminDefaults(criteria);
    for (const key of Object.keys(base)) {
      if (overrides[key]) base[key] = overrides[key];
      if (weights?.[key] !== undefined) base[key] = { ...base[key], importance: weights[key] };
    }
    return base;
  };
}

export const PRESETS: Preset[] = [
  // Tuned through each criterion's default weight, so it ignores saved preset weights.
  { id: "balanced", label: "Balanced", description: "The curator's default weights", criteria: (criteria) => adminDefaults(criteria) },
  {
    id: "beginner", label: "Beginner", description: "Simple rules first, quick to finish",
    criteria: tuned({
      complexity: { importance: 9, type: "cost" },
      playTime: { importance: 5, type: "cost" },
      rating: { importance: 3, type: "benefit" },
      minPlayers: { importance: 1, type: "cost" },
      minAge: { importance: 1, type: "cost" },
    }),
  },
  {
    id: "quick", label: "Quick & light", description: "Short, easy to teach, still well rated",
    criteria: tuned({
      playTime: { importance: 8, type: "cost" },
      complexity: { importance: 7, type: "cost" },
      rating: { importance: 5, type: "benefit" },
      minPlayers: { importance: 2, type: "cost" },
      minAge: { importance: 1, type: "cost" },
    }),
  },
  {
    id: "family", label: "Family night", description: "Kid-friendly and easy to learn",
    criteria: tuned({
      minAge: { importance: 8, type: "cost" },
      complexity: { importance: 6, type: "cost" },
      rating: { importance: 5, type: "benefit" },
      playTime: { importance: 4, type: "target", target: 30 },
      minPlayers: { importance: 2, type: "cost" },
    }),
  },
  {
    id: "brainburner", label: "Brain burner", description: "Deep strategy for experienced players",
    criteria: tuned({
      complexity: { importance: 8, type: "benefit" },
      rating: { importance: 7, type: "benefit" },
      playTime: { importance: 3, type: "benefit" },
      minPlayers: { importance: 1, type: "cost" },
      minAge: { importance: 0, type: "cost" },
    }),
  },
  {
    id: "toprated", label: "Crowd favourites", description: "Mostly about the community rating",
    criteria: tuned({
      rating: { importance: 10, type: "benefit" },
      complexity: { importance: 2, type: "target", target: 2.5 },
      playTime: { importance: 1, type: "cost" },
      minPlayers: { importance: 1, type: "cost" },
      minAge: { importance: 1, type: "cost" },
    }),
  },
];

export function defaultPreferences(catalog: Catalog): Preferences {
  return {
    groupSize: null, youngestAge: null, maxTime: null, genres: [], yearFrom: null, yearTo: null,
    favourites: [], diversify: true, criteria: adminDefaults(catalog.criteria),
  };
}

// ---------------------------------------------------------------------------
// Step 1: constraints (hard, plus soft tolerances for time and age)
// ---------------------------------------------------------------------------

/** A game may run up to 50% over the time limit, with a growing penalty. */
export const TIME_TOLERANCE = 0.5;
/** A game's recommended age may exceed the youngest player by up to 2 years. */
export const AGE_TOLERANCE = 2;
/** Score multiplier at the edge of a tolerance (linear from 1 at the limit). */
const EDGE_PENALTY = 0.5;

export type ExclusionReason = "players" | "age" | "time" | "genre" | "year" | "data" | "favourite";

export function exclusionReason(game: Game, prefs: Preferences, criteria: Criterion[]): ExclusionReason | null {
  const v = game.values;
  if (prefs.favourites.includes(game.id)) return "favourite";
  if (criteria.some((c) => !Number.isFinite(v[c.key]))) return "data";
  if (prefs.genres.length && !prefs.genres.includes(game.genreId)) return "genre";
  if (prefs.yearFrom !== null && game.year < prefs.yearFrom) return "year";
  if (prefs.yearTo !== null && game.year > prefs.yearTo) return "year";
  if (prefs.groupSize !== null) {
    if (v.minPlayers !== undefined && v.minPlayers > prefs.groupSize) return "players";
    if (game.maxPlayers !== null && game.maxPlayers < prefs.groupSize) return "players";
  }
  if (prefs.youngestAge !== null && v.minAge !== undefined && v.minAge > prefs.youngestAge + AGE_TOLERANCE) return "age";
  if (prefs.maxTime !== null && v.playTime !== undefined && v.playTime > prefs.maxTime * (1 + TIME_TOLERANCE)) return "time";
  return null;
}

export interface SoftResult {
  /** Score multiplier, 0..1. */
  penalty: number;
  /** Minutes over the limit, when over. */
  overTime?: number;
  /** Years above the youngest player, when over. */
  overAge?: number;
}

/** Penalty for games inside the soft tolerance but past the user's limit. */
export function softPenalty(game: Game, prefs: Preferences): SoftResult {
  const r: SoftResult = { penalty: 1 };
  const t = game.values.playTime, a = game.values.minAge;
  if (prefs.maxTime !== null && t > prefs.maxTime) {
    r.overTime = t - prefs.maxTime;
    r.penalty *= 1 - (1 - EDGE_PENALTY) * Math.min(1, r.overTime / (prefs.maxTime * TIME_TOLERANCE));
  }
  if (prefs.youngestAge !== null && a > prefs.youngestAge) {
    r.overAge = a - prefs.youngestAge;
    r.penalty *= 1 - (1 - EDGE_PENALTY) * Math.min(1, r.overAge / AGE_TOLERANCE);
  }
  return r;
}

// ---------------------------------------------------------------------------
// Fixed scales: every criterion is mapped to a 0..1 utility on a scale that
// spans the whole catalog, so it does not move when the user filters.
// ---------------------------------------------------------------------------

/** Criteria compared on a log scale: 15 vs 30 minutes matters more than 180 vs 195. */
const LOG_SCALE = new Set(["playTime"]);
const shape = (key: string, x: number) => (LOG_SCALE.has(key) ? Math.log2(Math.max(1, x)) : x);

export interface Scale { lo: number; hi: number }

export function utility(key: string, x: number, scale: Scale, pref: CriterionPref): number {
  const v = shape(key, x), lo = shape(key, scale.lo), hi = shape(key, scale.hi);
  const span = hi - lo;
  if (!(span > 0)) return 1;
  const pos = Math.min(1, Math.max(0, (v - lo) / span));
  if (pref.type === "benefit") return pos;
  if (pref.type === "cost") return 1 - pos;
  const t = shape(key, pref.target ?? x);
  const worst = Math.max(hi - t, t - lo, 1e-9);
  return Math.max(0, 1 - Math.abs(v - t) / worst);
}

// ---------------------------------------------------------------------------
// Step 2: derived values
// ---------------------------------------------------------------------------

/**
 * Bayesian average that blends BGG and TableTop Companion community ratings:
 *   with a BGG vote count:    (v·R + n·L + m·C) / (v + n + m)
 *   without one (old data):   (n·L + m·R) / (n + m)   (the BGG rating acts as the prior)
 * v/R = BGG votes/average, n/L = community votes/average, C = a conservative
 * prior (25th-percentile rating, like BGG's "Geek rating"), m = median vote
 * count (at least 50). Thin evidence cannot win on luck, and as local players
 * rate a game their opinion gradually takes over.
 */
export function bayesianRatings(games: Game[]): Map<number, number> {
  const rated = games.filter((g) => Number.isFinite(g.values.rating));
  const ratings = rated.map((g) => g.values.rating).sort((a, b) => a - b);
  const prior = ratings.length ? ratings[Math.floor((ratings.length - 1) * 0.25)] : 0;
  const votes = rated.map((g) => g.votes).filter((v): v is number => v !== null && v > 0).sort((a, b) => a - b);
  const m = Math.max(50, votes.length ? votes[Math.floor(votes.length / 2)] : 0);
  return new Map(
    rated.map((g) => {
      const n = g.community?.votes ?? 0, local = g.community?.rating ?? 0, R = g.values.rating;
      const value = g.votes === null
        ? (n * local + m * R) / (n + m)
        : (g.votes * R + n * local + m * prior) / (g.votes + n + m);
      return [g.id, value];
    }),
  );
}

/** 1 = poll says "best", 0.7 = "recommended", 0.4 = supported, 0.55 = no poll data. */
export function playerFit(game: Game, groupSize: number): number {
  if (game.bestPlayers.includes(groupSize)) return 1;
  if (game.recPlayers.includes(groupSize)) return 0.7;
  if (game.bestPlayers.length || game.recPlayers.length) return 0.4;
  return 0.55;
}

export interface Recommendation {
  game: Game;
  /** Final score, 0..1: TOPSIS closeness × soft-constraint penalty. */
  score: number;
  /** TOPSIS closeness before the penalty. */
  fit: number;
  soft: SoftResult;
  /** Final position (after diversity re-ranking, when enabled). */
  rank: number;
  /** Criterion key -> 0..1 utility on the criterion's fixed scale (1 = best possible). */
  closeness: Record<string, number>;
  /** Criterion key -> value used in the TOPSIS matrix. */
  used: Record<string, number>;
  /** Most similar favourite, for "because you like X". */
  because: { game: Game; shared: string[] } | null;
  /** Near-identical, lower-scored games folded under this one ("Mix it up"). */
  alike: Game[];
}

export interface RecommendationResult {
  items: Recommendation[];
  /** Active criteria (importance > 0 and applicable), in matrix column order. */
  used: Criterion[];
  topsis: AbsoluteTopsisResult | null;
  /** Candidates in TOPSIS matrix row order. */
  candidates: Game[];
  excluded: Partial<Record<ExclusionReason, number>>;
}

const similarityCache = new WeakMap<Game[], SimilarityIndex>();
export function similarityFor(games: Game[]): SimilarityIndex {
  let idx = similarityCache.get(games);
  if (!idx) {
    idx = buildSimilarityIndex(games);
    similarityCache.set(games, idx);
  }
  return idx;
}

export function activeCriteria(catalog: Catalog, prefs: Preferences): Criterion[] {
  const on = (key: string) => (prefs.criteria[key]?.importance ?? 0) > 0;
  return [
    ...catalog.criteria.filter((c) => on(c.key)),
    ...DERIVED.filter((c) => on(c.key) && (c.key === PLAYER_FIT ? prefs.groupSize !== null : prefs.favourites.length > 0)),
  ];
}

// ---------------------------------------------------------------------------
// Steps 3 + 4: TOPSIS, then optional MMR diversity re-ranking
// ---------------------------------------------------------------------------

export function recommend(catalog: Catalog, prefs: Preferences): RecommendationResult {
  const excluded: RecommendationResult["excluded"] = {};
  const candidates: Game[] = [];
  for (const g of catalog.games) {
    if (g.recommended === false) continue; // taken out by an admin; not a mismatch to report
    const reason = exclusionReason(g, prefs, catalog.criteria);
    if (reason) {
      if (reason !== "favourite") excluded[reason] = (excluded[reason] ?? 0) + 1;
    } else candidates.push(g);
  }

  const used = activeCriteria(catalog, prefs);
  if (!candidates.length || !used.length) return { items: [], used, topsis: null, candidates, excluded };

  const sim = similarityFor(catalog.games);
  const bayes = bayesianRatings(catalog.games);
  const favourites = catalog.games.filter((g) => prefs.favourites.includes(g.id));
  const because = new Map<number, Recommendation["because"]>();

  const valueOf = (g: Game, key: string): number => {
    if (key === "rating") return bayes.get(g.id) ?? g.values.rating;
    if (key === PLAYER_FIT) return playerFit(g, prefs.groupSize ?? 0);
    if (key === TASTE) {
      let best = 0;
      for (const f of favourites) {
        const s = sim.similarity(g, f);
        if (s > best) {
          best = s;
          because.set(g.id, { game: f, shared: sim.sharedTags(g, f).slice(0, 3) });
        }
      }
      return best;
    }
    return g.values[key];
  };

  const matrix = candidates.map((g) => used.map((c) => valueOf(g, c.key)));

  // Scales span the whole catalog (not just today's candidates) so filtering
  // never moves them. Derived criteria are already 0..1.
  const scales: Scale[] = used.map((c) => {
    if (c.id < 0) return { lo: 0, hi: 1 };
    const xs = catalog.games.map((g) => (c.key === "rating" ? (bayes.get(g.id) ?? g.values.rating) : g.values[c.key]))
      .filter(Number.isFinite);
    return { lo: Math.min(...xs), hi: Math.max(...xs) };
  });
  const utilities = matrix.map((row) => row.map((x, j) => utility(used[j].key, x, scales[j], prefs.criteria[used[j].key])));
  const soft = candidates.map((g) => softPenalty(g, prefs));
  const result = topsisAbsolute(matrix, utilities, used.map((c) => prefs.criteria[c.key].importance), soft.map((x) => x.penalty));

  const { top, alike } = prefs.diversify
    ? foldSimilar(result.order, candidates, sim, result.scores)
    : { top: result.order, alike: new Map<number, number[]>() };

  const items = top.map((i, pos) => ({
    game: candidates[i],
    score: result.scores[i],
    fit: result.fit[i],
    soft: soft[i],
    rank: prefs.diversify ? pos + 1 : result.ranks[i],
    alike: (alike.get(i) ?? []).map((k) => candidates[k]),
    closeness: Object.fromEntries(used.map((c, j) => [c.key, result.closeness[i][j]])),
    used: Object.fromEntries(used.map((c, j) => [c.key, matrix[i][j]])),
    because: because.get(candidates[i].id) ?? null,
  }));
  return { items, used, topsis: result, candidates, excluded };
}

/** Similarity above which two games count as near-identical. */
export const ALIKE_THRESHOLD = 0.9;

/** Only fold a game whose score is within this distance of the game it folds under. */
export const ALIKE_SCORE_BAND = 0.05;

/**
 * Folds near-identical games under the best-scored one. Walks the list in
 * score order; a game that is near-identical to an already listed game and
 * scores almost the same is attached to it (up to `maxAlike` per game)
 * instead of taking its own slot. The listed games stay in strict score order.
 */
export function foldSimilar(
  order: number[], games: Game[], sim: SimilarityIndex, scores: number[],
  threshold = ALIKE_THRESHOLD, band = ALIKE_SCORE_BAND, maxAlike = 3,
): { top: number[]; alike: Map<number, number[]> } {
  const top: number[] = [];
  const alike = new Map<number, number[]>();
  for (const i of order) {
    const parent = top.find((p) =>
      (alike.get(p)?.length ?? 0) < maxAlike && scores[p] - scores[i] <= band && sim.similarity(games[i], games[p]) >= threshold);
    if (parent === undefined) top.push(i);
    else alike.set(parent, [...(alike.get(parent) ?? []), i]);
  }
  return { top, alike };
}

// ---------------------------------------------------------------------------
// Step 5: explanations (language-neutral codes; see src/lib/format.ts)
// ---------------------------------------------------------------------------

export interface Reason {
  /** Criterion key the reason is about. */
  key: string;
  tone: "good" | "bad";
  /** Dictionary key in `reasons`, e.g. "complexity.cost.good". */
  code: string;
  /** Raw value to format with the criterion's unit. */
  value?: number;
  n?: number;
  name?: string;
  shared?: string[];
}

export function explain(rec: Recommendation, used: Criterion[], prefs: Preferences): Reason[] {
  const total = used.reduce((s, c) => s + prefs.criteria[c.key].importance, 0) || 1;
  const scored = used.map((c) => ({
    c, pref: prefs.criteria[c.key], share: prefs.criteria[c.key].importance / total, close: rec.closeness[c.key],
  }));
  const good = scored
    .filter((s) => s.close >= 0.7)
    .sort((a, b) => b.share * b.close - a.share * a.close)
    .slice(0, 2)
    .map((s) => describe(s.c, s.pref, rec, true, prefs));
  const soft: Reason[] = [];
  if (rec.soft.overTime) soft.push({ key: "playTime", tone: "bad", code: "soft.time", value: rec.game.values.playTime });
  if (rec.soft.overAge) soft.push({ key: "minAge", tone: "bad", code: "soft.age", value: rec.game.values.minAge });
  const bad = soft.length ? soft : scored
    .filter((s) => s.close <= 0.3 && s.share >= 0.12)
    .sort((a, b) => b.share * (1 - b.close) - a.share * (1 - a.close))
    .slice(0, 1)
    .map((s) => describe(s.c, s.pref, rec, false, prefs));
  return [...good.filter((g) => !soft.some((x) => x.key === g.key)), ...bad];
}

const KNOWN = new Set(["minPlayers", "rating", "complexity", "playTime", "minAge"]);
const DIRECTIONAL = new Set(["complexity", "playTime"]);

function describe(c: Criterion, pref: CriterionPref, rec: Recommendation, good: boolean, prefs: Preferences): Reason {
  const tone = good ? "good" : "bad";
  const value = c.key === "rating" ? rec.game.values.rating : rec.used[c.key];
  const base = { key: c.key, tone, value } as const;
  if (c.key === TASTE) {
    const b = rec.because;
    if (!b) return { key: c.key, tone, code: good ? "taste.close" : "taste.far" };
    return { key: c.key, tone, code: good ? "taste.like" : "taste.unlike", name: b.game.name, shared: good ? b.shared : [] };
  }
  if (c.key === PLAYER_FIT) {
    const n = prefs.groupSize ?? 0;
    const code = rec.game.bestPlayers.includes(n) ? "fit.best" : good ? "fit.good" : "fit.bad";
    return { key: c.key, tone, code, n };
  }
  if (pref.type === "target") return { ...base, code: `target.${tone}` };
  if (DIRECTIONAL.has(c.key)) return { ...base, code: `${c.key}.${pref.type}.${tone}` };
  if (KNOWN.has(c.key)) return { ...base, code: `${c.key}.${tone}` };
  return { ...base, code: `${pref.type === "benefit" ? "high" : "low"}.${tone}` };
}

// ---------------------------------------------------------------------------
// URL state, so results are shareable and survive reloads.
//   ?players=4&age=10&time=60&genres=1,3&from=2010&to=2016&fav=12,40&div=0
//   &c=rating:7b,complexity:5t2.5,playTime:4c     (b=benefit c=cost tN=target)
// ---------------------------------------------------------------------------

export function toSearchParams(prefs: Preferences, catalog: Catalog): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: number | null) => v !== null && p.set(k, String(v));
  set("players", prefs.groupSize);
  set("age", prefs.youngestAge);
  set("time", prefs.maxTime);
  if (prefs.genres.length) p.set("genres", prefs.genres.join(","));
  set("from", prefs.yearFrom);
  set("to", prefs.yearTo);
  if (prefs.favourites.length) p.set("fav", prefs.favourites.join(","));
  if (!prefs.diversify) p.set("div", "0");
  const defaults = adminDefaults(catalog.criteria);
  const keys = Object.keys(defaults);
  const changed = keys.some((k) => {
    const a = prefs.criteria[k], b = defaults[k];
    return a.importance !== b.importance || a.type !== b.type || a.target !== b.target;
  });
  if (changed) {
    p.set("c", keys.map((k) => {
      const x = prefs.criteria[k];
      return `${k}:${x.importance}${x.type === "target" ? `t${x.target ?? 0}` : x.type[0]}`;
    }).join(","));
  }
  return p;
}

export function fromSearchParams(params: URLSearchParams, catalog: Catalog): Preferences {
  const prefs = defaultPreferences(catalog);
  const num = (key: string, min: number, max: number) => {
    const raw = params.get(key);
    if (raw === null || raw === "") return null;
    const v = Number(raw);
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : null;
  };
  prefs.groupSize = num("players", 1, 20);
  prefs.youngestAge = num("age", 1, 99);
  prefs.maxTime = num("time", 5, 1000);
  prefs.yearFrom = num("from", 1900, 2100);
  prefs.yearTo = num("to", 1900, 2100);
  const ids = (key: string, valid: Set<number>) =>
    (params.get(key) ?? "").split(",").filter(Boolean).map(Number).filter((id) => valid.has(id));
  prefs.genres = ids("genres", new Set(catalog.genres.map((g) => g.id)));
  prefs.favourites = ids("fav", new Set(catalog.games.map((g) => g.id))).slice(0, 10);
  prefs.diversify = params.get("div") !== "0";
  for (const part of (params.get("c") ?? "").split(",")) {
    const m = /^(\w+):(\d+(?:\.\d+)?)(b|c|t(-?\d+(?:\.\d+)?))$/.exec(part);
    if (!m || !prefs.criteria[m[1]]) continue;
    const type: CriterionType = m[3] === "b" ? "benefit" : m[3] === "c" ? "cost" : "target";
    prefs.criteria[m[1]] = {
      importance: Math.min(10, Number(m[2])),
      type,
      target: type === "target" ? Number(m[4]) : undefined,
    };
  }
  return prefs;
}
