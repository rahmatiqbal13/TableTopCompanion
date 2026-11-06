import { buildSimilarityIndex, type SimilarityIndex } from "./similarity";
import { topsis, type TopsisResult } from "./topsis";
import type { Catalog, Criterion, CriterionType, Game } from "./types";

/*
 * Hybrid TOPSIS recommender
 * -------------------------
 * 1. Hard constraints remove games that cannot work tonight (group size,
 *    youngest player, time available, genre, year).
 * 2. Criteria are built per candidate:
 *      - catalog criteria (rating, complexity, play time, ...); the rating is
 *        replaced by a Bayesian average when vote counts are known, so a
 *        9.0 from 30 votes does not beat an 8.0 from 50 000 votes;
 *      - "Player-count fit" (derived, needs a group size): how well the game
 *        plays at exactly that count, from BGG's "best with" poll;
 *      - "Taste match" (derived, needs favourites): content similarity to
 *        the games the user already loves.
 * 3. TOPSIS ranks candidates by closeness to the ideal solution.
 * 4. Optional MMR re-ranking trades a little score for variety so the top
 *    results are not near-duplicates of each other.
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
  criteria: (criteria: Criterion[]) => Record<string, CriterionPref>;
}

export function adminDefaults(criteria: Criterion[]): Record<string, CriterionPref> {
  return Object.fromEntries(
    [...criteria, ...DERIVED].map((c) => [c.key, { importance: Math.round(c.defaultWeight * 20), type: c.type }]),
  );
}

/** Known criterion keys get tuned values; unknown (admin-added) keys keep defaults. */
function tuned(overrides: Record<string, CriterionPref>): Preset["criteria"] {
  return (criteria) => {
    const base = adminDefaults(criteria);
    for (const key of Object.keys(base)) if (overrides[key]) base[key] = overrides[key];
    return base;
  };
}

export const PRESETS: Preset[] = [
  { id: "balanced", label: "Balanced", description: "The curator's default weights", criteria: adminDefaults },
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
// Step 1: hard constraints
// ---------------------------------------------------------------------------

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
  if (prefs.youngestAge !== null && v.minAge !== undefined && v.minAge > prefs.youngestAge) return "age";
  if (prefs.maxTime !== null && v.playTime !== undefined && v.playTime > prefs.maxTime) return "time";
  return null;
}

// ---------------------------------------------------------------------------
// Step 2: derived values
// ---------------------------------------------------------------------------

/**
 * Bayesian average: (v·R + m·C) / (v + m). Ratings with few votes are pulled
 * toward a deliberately conservative prior C (the 25th-percentile rating),
 * the same idea as BGG's "Geek rating", so thin evidence cannot win on luck.
 * Prior strength m is the median vote count (at least 50).
 */
export function bayesianRatings(games: Game[]): Map<number, number> {
  const rated = games.filter((g) => Number.isFinite(g.values.rating));
  const ratings = rated.map((g) => g.values.rating).sort((a, b) => a - b);
  const prior = ratings.length ? ratings[Math.floor((ratings.length - 1) * 0.25)] : 0;
  const votes = rated.map((g) => g.votes).filter((v): v is number => v !== null && v > 0).sort((a, b) => a - b);
  const m = Math.max(50, votes.length ? votes[Math.floor(votes.length / 2)] : 0);
  return new Map(
    rated.map((g) => [
      g.id,
      g.votes === null ? g.values.rating : (g.votes * g.values.rating + m * prior) / (g.votes + m),
    ]),
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
  /** TOPSIS closeness, 0..1. */
  score: number;
  /** Final position (after diversity re-ranking, when enabled). */
  rank: number;
  /** Criterion key -> 0..1 closeness to the best candidate on that criterion. */
  closeness: Record<string, number>;
  /** Criterion key -> value used in the TOPSIS matrix. */
  used: Record<string, number>;
  /** Most similar favourite, for "because you like X". */
  because: { game: Game; shared: string[] } | null;
}

export interface RecommendationResult {
  items: Recommendation[];
  /** Active criteria (importance > 0 and applicable), in matrix column order. */
  used: Criterion[];
  topsis: TopsisResult | null;
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
  const specs = used.map((c) => {
    const p = prefs.criteria[c.key];
    return { weight: p.importance, type: p.type, target: p.type === "target" ? (p.target ?? 0) : undefined };
  });
  const result = topsis(matrix, specs);

  let order = result.order;
  if (prefs.diversify) order = mmr(order, result.scores, candidates, sim);

  const items = order.map((i, pos) => ({
    game: candidates[i],
    score: result.scores[i],
    rank: prefs.diversify ? pos + 1 : result.ranks[i],
    closeness: Object.fromEntries(used.map((c, j) => [c.key, result.closeness[i][j]])),
    used: Object.fromEntries(used.map((c, j) => [c.key, matrix[i][j]])),
    because: because.get(candidates[i].id) ?? null,
  }));
  return { items, used, topsis: result, candidates, excluded };
}

/**
 * Maximal Marginal Relevance over the top of the list:
 * next = argmax  λ·score − (1−λ)·redundancy,
 * where redundancy only counts similarity above `threshold` (rescaled to 0..1),
 * so merely related games are untouched and only near-duplicates get pushed down.
 * Only the first `window` positions are re-ordered; the tail keeps TOPSIS order.
 */
export function mmr(
  order: number[], scores: number[], games: Game[], sim: SimilarityIndex,
  lambda = 0.8, window = 12, threshold = 0.6,
): number[] {
  const pool = order.slice(0, Math.min(order.length, window * 3));
  const picked: number[] = [];
  while (picked.length < Math.min(window, pool.length)) {
    let bestIdx = -1, bestVal = -Infinity;
    for (const i of pool) {
      if (picked.includes(i)) continue;
      const maxSim = picked.length ? Math.max(...picked.map((p) => sim.similarity(games[i], games[p]))) : 0;
      const redundancy = Math.max(0, maxSim - threshold) / (1 - threshold);
      const val = lambda * scores[i] - (1 - lambda) * redundancy;
      if (val > bestVal) { bestVal = val; bestIdx = i; }
    }
    picked.push(bestIdx);
  }
  const rest = order.filter((i) => !picked.includes(i));
  return [...picked, ...rest];
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
  const bad = scored
    .filter((s) => s.close <= 0.3 && s.share >= 0.12)
    .sort((a, b) => b.share * (1 - b.close) - a.share * (1 - a.close))
    .slice(0, 1)
    .map((s) => describe(s.c, s.pref, rec, false, prefs));
  return [...good, ...bad];
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
