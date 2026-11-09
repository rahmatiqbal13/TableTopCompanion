import { describe, expect, it } from "vitest";
import seed from "../../data/seed.json";
import {
  AGE_TOLERANCE, bayesianRatings, defaultPreferences, explain, TIME_TOLERANCE, fromSearchParams, PLAYER_FIT, playerFit, recommend, toSearchParams, TASTE,
} from "../recommend";
import { buildSimilarityIndex } from "../similarity";
import type { Catalog, Game } from "../types";

const catalog = { ...(seed as unknown as Omit<Catalog, "live" | "updatedAt">), live: false, updatedAt: null } as Catalog;
const game = (over: Partial<Game> & { id: number }): Game => ({
  bggId: null, name: `G${over.id}`, year: 2010, genreId: 1, imageUrl: null, linkUrl: null,
  values: { minPlayers: 2, rating: 7, complexity: 2, playTime: 30, minAge: 8 },
  maxPlayers: null, bestPlayers: [], recPlayers: [], votes: null, bggRank: null,
  categories: [], mechanics: [], description: null, community: null, ...over,
});

describe("recommend", () => {
  it("ranks every seed game with default preferences", () => {
    const r = recommend(catalog, { ...defaultPreferences(catalog), diversify: false });
    expect(r.items).toHaveLength(140);
    expect(r.items[0].rank).toBe(1);
    for (let i = 1; i < r.items.length; i++) expect(r.items[i - 1].score).toBeGreaterThanOrEqual(r.items[i].score);
  });

  it("applies hard and soft constraints and counts exclusions", () => {
    const prefs = { ...defaultPreferences(catalog), groupSize: 1, youngestAge: 8, maxTime: 30, diversify: false };
    const r = recommend(catalog, prefs);
    for (const it of r.items) {
      const g = it.game;
      expect(g.values.minPlayers).toBeLessThanOrEqual(1);
      expect(g.values.minAge).toBeLessThanOrEqual(8 + AGE_TOLERANCE);
      expect(g.values.playTime).toBeLessThanOrEqual(30 * (1 + TIME_TOLERANCE));
      const over = g.values.playTime > 30 || g.values.minAge > 8;
      expect(it.soft.penalty < 1).toBe(over);
      expect(it.score).toBeCloseTo(it.fit * it.soft.penalty, 12);
    }
    const excluded = Object.values(r.excluded).reduce((a, b) => a + (b ?? 0), 0);
    expect(r.candidates.length + excluded).toBe(140);
  });

  it("uses maxPlayers when known", () => {
    const c = { ...catalog, games: [game({ id: 1, maxPlayers: 4 }), game({ id: 2, maxPlayers: 6 })] };
    const r = recommend(c, { ...defaultPreferences(c), groupSize: 5 });
    expect(r.items.map((i) => i.game.id)).toEqual([2]);
  });

  it("folding look-alikes keeps every game, in strict score order", () => {
    const a = recommend(catalog, { ...defaultPreferences(catalog), diversify: false });
    const b = recommend(catalog, { ...defaultPreferences(catalog), diversify: true });
    const shown = b.items.flatMap((i) => [i.game.id, ...i.alike.map((g) => g.id)]);
    expect(new Set(shown)).toEqual(new Set(a.items.map((i) => i.game.id)));
    expect(shown).toHaveLength(a.items.length);
    expect(b.items.map((i) => i.rank)).toEqual(b.items.map((_, i) => i + 1));
    for (let k = 1; k < b.items.length; k++) expect(b.items[k - 1].score).toBeGreaterThanOrEqual(b.items[k].score);
    for (const it of b.items) for (const g of it.alike) expect(a.items.find((x) => x.game.id === g.id)!.score).toBeLessThanOrEqual(it.score);
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

describe("fixed-scale TOPSIS", () => {
  it("has no rank reversal: filtering never reorders the remaining games", () => {
    const base = { ...defaultPreferences(catalog), diversify: false };
    const all = recommend(catalog, base).items;
    const cards = recommend(catalog, { ...base, genres: [1] }).items;
    const fromAll = all.filter((i) => i.game.genreId === 1);
    expect(cards.map((i) => i.game.id)).toEqual(fromAll.map((i) => i.game.id));
    cards.forEach((c, k) => expect(c.score).toBeCloseTo(fromAll[k].score, 12));
  });

  it("penalizes a game slightly over the time limit below an otherwise identical one", () => {
    const c = { ...catalog, games: [
      game({ id: 1, values: { minPlayers: 2, rating: 7, complexity: 2, playTime: 55, minAge: 8 } }),
      game({ id: 2, values: { minPlayers: 2, rating: 7, complexity: 2, playTime: 65, minAge: 8 } }),
      game({ id: 3, values: { minPlayers: 2, rating: 7, complexity: 2, playTime: 120, minAge: 8 } }),
    ] };
    const prefs = { ...defaultPreferences(c), maxTime: 60, diversify: false };
    prefs.criteria = Object.fromEntries(Object.entries(prefs.criteria).map(([k, v]) => [k, { ...v, importance: k === "rating" ? 5 : 0 }]));
    const r = recommend(c, prefs);
    expect(r.items.map((i) => i.game.id)).toEqual([1, 2]);
    expect(r.excluded.time).toBe(1);
    expect(r.items[1].soft.overTime).toBe(5);
    expect(explain(r.items[1], r.used, prefs).some((x) => x.code === "soft.time")).toBe(true);
  });

  it("gives 100% to a game that is best on every active criterion", () => {
    const c = { ...catalog, games: [
      game({ id: 1, values: { minPlayers: 1, rating: 9, complexity: 1, playTime: 10, minAge: 6 } }),
      game({ id: 2, values: { minPlayers: 4, rating: 6, complexity: 4, playTime: 240, minAge: 14 } }),
    ] };
    const prefs = { ...defaultPreferences(c), diversify: false };
    for (const [k, type] of [["minPlayers", "cost"], ["rating", "benefit"], ["complexity", "cost"], ["playTime", "cost"], ["minAge", "cost"]] as const) {
      prefs.criteria[k] = { importance: 5, type };
    }
    const [best, worst] = recommend(c, prefs).items;
    expect(best.score).toBeCloseTo(1, 12);
    expect(worst.score).toBeCloseTo(0, 12);
  });
});

describe("explain", () => {
  it("never cites a criterion that is identical for every candidate", () => {
    // Legacy data has no player-count poll, so player fit is the same for all games.
    const prefs = { ...defaultPreferences(catalog), groupSize: 4 };
    const r = recommend(catalog, prefs);
    for (const item of r.items) expect(explain(item, r.used, prefs).some((x) => x.key === PLAYER_FIT)).toBe(false);
  });
  it("folds a game that is identical to a higher one", () => {
    const twin = { minPlayers: 2, rating: 7, complexity: 2, playTime: 30, minAge: 8 };
    const c = { ...catalog, games: [game({ id: 1, values: { ...twin, rating: 8 } }), game({ id: 2, values: twin }), game({ id: 3, genreId: 5, values: { minPlayers: 2, rating: 6, complexity: 4, playTime: 180, minAge: 14 } })] };
    const r = recommend(c, defaultPreferences(c));
    expect(r.items.map((i) => i.game.id)).toEqual([1, 3]);
    expect(r.items[0].alike.map((g) => g.id)).toEqual([2]);
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
  it("blends community ratings in, gradually", () => {
    const few = bayesianRatings([game({ id: 1, community: { rating: 10, votes: 2 } })]).get(1)!;
    const many = bayesianRatings([game({ id: 1, community: { rating: 10, votes: 500 } })]).get(1)!;
    expect(few).toBeGreaterThan(7);
    expect(few).toBeLessThan(7.2); // two fans can't swing it
    expect(many).toBeGreaterThan(9.5); // a real local consensus takes over
    const withBgg = bayesianRatings([
      game({ id: 1, values: { rating: 8 }, votes: 1000 }),
      game({ id: 2, values: { rating: 8 }, votes: 1000, community: { rating: 5, votes: 1000 } }),
    ]);
    expect(withBgg.get(2)!).toBeCloseTo(7, 6); // (1000·8 + 1000·5 + 1000·8) / 3000
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
