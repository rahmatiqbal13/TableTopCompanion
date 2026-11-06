import { describe, expect, it } from "vitest";
import seed from "../../data/seed.json";
import {
  bayesianRatings, defaultPreferences, explain, fromSearchParams, PLAYER_FIT, playerFit, recommend, toSearchParams, TASTE,
} from "../recommend";
import { buildSimilarityIndex } from "../similarity";
import type { Catalog, Game } from "../types";

const catalog = { ...(seed as unknown as Omit<Catalog, "live" | "updatedAt">), live: false, updatedAt: null } as Catalog;
const game = (over: Partial<Game> & { id: number }): Game => ({
  bggId: null, name: `G${over.id}`, year: 2010, genreId: 1, imageUrl: null, linkUrl: null,
  values: { minPlayers: 2, rating: 7, complexity: 2, playTime: 30, minAge: 8 },
  maxPlayers: null, bestPlayers: [], recPlayers: [], votes: null, bggRank: null,
  categories: [], mechanics: [], description: null, ...over,
});

describe("recommend", () => {
  it("ranks every seed game with default preferences", () => {
    const r = recommend(catalog, { ...defaultPreferences(catalog), diversify: false });
    expect(r.items).toHaveLength(140);
    expect(r.items[0].rank).toBe(1);
    for (let i = 1; i < r.items.length; i++) expect(r.items[i - 1].score).toBeGreaterThanOrEqual(r.items[i].score);
  });

  it("applies hard constraints and counts exclusions", () => {
    const prefs = { ...defaultPreferences(catalog), groupSize: 1, youngestAge: 8, maxTime: 30 };
    const r = recommend(catalog, prefs);
    for (const { game: g } of r.items) {
      expect(g.values.minPlayers).toBeLessThanOrEqual(1);
      expect(g.values.minAge).toBeLessThanOrEqual(8);
      expect(g.values.playTime).toBeLessThanOrEqual(30);
    }
    const excluded = Object.values(r.excluded).reduce((a, b) => a + (b ?? 0), 0);
    expect(r.items.length + excluded).toBe(140);
  });

  it("uses maxPlayers when known", () => {
    const c = { ...catalog, games: [game({ id: 1, maxPlayers: 4 }), game({ id: 2, maxPlayers: 6 })] };
    const r = recommend(c, { ...defaultPreferences(c), groupSize: 5 });
    expect(r.items.map((i) => i.game.id)).toEqual([2]);
  });

  it("diversity re-ranking returns a permutation of the same games", () => {
    const a = recommend(catalog, { ...defaultPreferences(catalog), diversify: false });
    const b = recommend(catalog, { ...defaultPreferences(catalog), diversify: true });
    expect(new Set(b.items.map((i) => i.game.id))).toEqual(new Set(a.items.map((i) => i.game.id)));
    expect(b.items.map((i) => i.rank)).toEqual(b.items.map((_, i) => i + 1));
  });

  it("taste match pulls similar games up and excludes the favourites themselves", () => {
    const fav = catalog.games.find((g) => g.name === "Sushi Go!")!;
    const prefs = { ...defaultPreferences(catalog), favourites: [fav.id], diversify: false };
    prefs.criteria = Object.fromEntries(Object.entries(prefs.criteria).map(([k, v]) => [k, { ...v, importance: k === TASTE ? 10 : 0 }]));
    const r = recommend(catalog, prefs);
    expect(r.items.some((i) => i.game.id === fav.id)).toBe(false);
    expect(r.items[0].game.genreId).toBe(fav.genreId);
    expect(r.items[0].because?.game.id).toBe(fav.id);
  });
});

describe("explain", () => {
  it("never cites a criterion that is identical for every candidate", () => {
    // Legacy data has no player-count poll, so player fit is the same for all games.
    const prefs = { ...defaultPreferences(catalog), groupSize: 4 };
    const r = recommend(catalog, prefs);
    for (const item of r.items) expect(explain(item, r.used, prefs).some((x) => x.key === PLAYER_FIT)).toBe(false);
  });
  it("diversity only reorders near-duplicates, keeping scores mostly descending", () => {
    const r = recommend(catalog, { ...defaultPreferences(catalog), groupSize: 4, youngestAge: 10 });
    const inversions = r.items.slice(0, 12).filter((it, i, a) => i > 0 && a[i - 1].score < it.score - 0.05).length;
    expect(inversions).toBeLessThanOrEqual(2);
  });
});

describe("bayesian rating", () => {
  it("shrinks low-vote ratings toward the mean", () => {
    const games = [
      game({ id: 1, values: { rating: 9.5 }, votes: 10 }),
      game({ id: 2, values: { rating: 8.0 }, votes: 50000 }),
      game({ id: 3, values: { rating: 6.5 }, votes: 400 }),
    ];
    const b = bayesianRatings(games);
    expect(b.get(2)!).toBeGreaterThan(b.get(1)!);
  });
  it("leaves ratings without vote counts unchanged", () => {
    expect(bayesianRatings([game({ id: 1 })]).get(1)).toBe(7);
  });
});

describe("playerFit", () => {
  it("scores best > recommended > supported", () => {
    const g = game({ id: 1, bestPlayers: [3], recPlayers: [2, 3, 4] });
    expect(playerFit(g, 3)).toBeGreaterThan(playerFit(g, 2));
    expect(playerFit(g, 2)).toBeGreaterThan(playerFit(g, 5));
  });
});

describe("similarity", () => {
  it("is symmetric and 1 for the same game", () => {
    const idx = buildSimilarityIndex(catalog.games);
    const [a, b] = catalog.games;
    expect(idx.similarity(a, a)).toBe(1);
    expect(idx.similarity(a, b)).toBeCloseTo(idx.similarity(b, a), 12);
  });
  it("rewards shared rare mechanics", () => {
    const games = [
      game({ id: 1, mechanics: ["Deck Building", "Hand Management"] }),
      game({ id: 2, mechanics: ["Deck Building"] }),
      game({ id: 3, mechanics: ["Hand Management", "Dice Rolling"] }),
      game({ id: 4, mechanics: ["Hand Management"] }),
    ];
    const idx = buildSimilarityIndex(games);
    expect(idx.similarity(games[0], games[1])).toBeGreaterThan(idx.similarity(games[0], games[3]));
    expect(idx.sharedTags(games[0], games[1])).toEqual(["Deck Building"]);
  });
});

describe("URL state", () => {
  it("round-trips preferences", () => {
    const prefs = { ...defaultPreferences(catalog), groupSize: 4, youngestAge: 10, genres: [1, 3], favourites: [5], diversify: false };
    prefs.criteria.playTime = { importance: 6, type: "target", target: 45 };
    const back = fromSearchParams(toSearchParams(prefs, catalog), catalog);
    expect(back).toEqual(prefs);
  });
  it("ignores garbage", () => {
    const p = fromSearchParams(new URLSearchParams("players=abc&genres=99,1&c=evil:9x,rating:3c"), catalog);
    expect(p.groupSize).toBeNull();
    expect(p.genres).toEqual([1]);
    expect(p.criteria.rating).toEqual({ importance: 3, type: "cost", target: undefined });
  });
});
