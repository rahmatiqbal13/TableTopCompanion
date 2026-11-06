import type { Game } from "./types";

/**
 * Content-based similarity between games.
 *
 * Tags (mechanics, categories, genre) are IDF-weighted so rare, telling tags
 * ("Deck Building") count more than common ones ("Card Game"). The tag cosine
 * is blended with closeness on the numeric profile (complexity, length, age,
 * player count) so games without BGG tags still get a meaningful similarity.
 */
export interface SimilarityIndex {
  similarity(a: Game, b: Game): number;
  /** Tags two games share, most distinctive first. */
  sharedTags(a: Game, b: Game): string[];
}

const NUMERIC: { key: string; scale: (x: number) => number }[] = [
  { key: "complexity", scale: (x) => x },
  { key: "playTime", scale: (x) => Math.log2(Math.max(1, x)) },
  { key: "minAge", scale: (x) => x },
  { key: "minPlayers", scale: (x) => x },
];

function tags(g: Game): string[] {
  return [`g:${g.genreId}`, ...g.mechanics.map((m) => `m:${m}`), ...g.categories.map((c) => `c:${c}`)];
}

export function buildSimilarityIndex(games: Game[]): SimilarityIndex {
  const df = new Map<string, number>();
  for (const g of games) for (const t of new Set(tags(g))) df.set(t, (df.get(t) ?? 0) + 1);
  const idf = (t: string) => Math.log((1 + games.length) / (1 + (df.get(t) ?? 0))) + 1;

  // Standard deviation per numeric feature, to put them on one scale.
  const sd = NUMERIC.map(({ key, scale }) => {
    const xs = games.map((g) => g.values[key]).filter(Number.isFinite).map(scale);
    const mean = xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
    const v = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length || 1);
    return Math.sqrt(v) || 1;
  });

  const vectors = new Map<number, Map<string, number>>();
  const vec = (g: Game) => {
    let v = vectors.get(g.id);
    if (!v) {
      v = new Map(tags(g).map((t) => [t, idf(t)]));
      vectors.set(g.id, v);
    }
    return v;
  };
  const norm = (v: Map<string, number>) => Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0));

  const tagCosine = (a: Game, b: Game) => {
    const va = vec(a), vb = vec(b);
    let dot = 0;
    for (const [t, w] of va) dot += w * (vb.get(t) ?? 0);
    const n = norm(va) * norm(vb);
    return n ? dot / n : 0;
  };

  const numericCloseness = (a: Game, b: Game) => {
    let sum = 0, count = 0;
    NUMERIC.forEach(({ key, scale }, i) => {
      const x = a.values[key], y = b.values[key];
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      sum += ((scale(x) - scale(y)) / sd[i]) ** 2;
      count++;
    });
    if (!count) return 0.5;
    // Gaussian kernel on the standardized distance: 1 when identical.
    return Math.exp(-sum / (2 * count));
  };

  return {
    similarity(a, b) {
      if (a.id === b.id) return 1;
      const rich = a.mechanics.length > 0 && b.mechanics.length > 0;
      const alpha = rich ? 0.65 : 0.35;
      return alpha * tagCosine(a, b) + (1 - alpha) * numericCloseness(a, b);
    },
    sharedTags(a, b) {
      const vb = vec(b);
      return [...vec(a).entries()]
        .filter(([t]) => vb.has(t) && !t.startsWith("g:"))
        .sort((x, y) => y[1] - x[1])
        .map(([t]) => t.slice(2));
    },
  };
}
