import { describe, expect, it } from "vitest";
import { topsis, topsisAbsolute } from "../topsis";
import seed from "../../data/seed.json";

describe("topsis", () => {
  it("matches a hand-computed example", () => {
    // 3 alternatives, criteria: price (cost, w .5), quality (benefit, w .5)
    const r = topsis([[250, 7], [200, 9], [300, 6]], [
      { weight: 0.5, type: "cost" },
      { weight: 0.5, type: "benefit" },
    ]);
    // Column norms: sqrt(250²+200²+300²)=438.748, sqrt(49+81+36)=12.884
    expect(r.normalized[0][0]).toBeCloseTo(250 / 438.748, 5);
    expect(r.weighted[1][1]).toBeCloseTo((9 / 12.884) * 0.5, 4);
    // Alternative 2 is cheapest and best quality: it is the ideal solution.
    expect(r.dPlus[1]).toBeCloseTo(0, 10);
    expect(r.scores[1]).toBeCloseTo(1, 10);
    expect(r.scores[2]).toBeCloseTo(0, 10);
    expect(r.order).toEqual([1, 0, 2]);
    expect(r.ranks).toEqual([2, 1, 3]);
  });

  it("gives tied alternatives the same rank", () => {
    const r = topsis([[1, 5], [1, 5], [0, 1]], [{ weight: 1, type: "benefit" }, { weight: 1, type: "benefit" }]);
    expect(r.ranks).toEqual([1, 1, 3]);
  });

  it("normalizes weights and survives all-zero weights and zero columns", () => {
    const r = topsis([[0, 2], [0, 4]], [{ weight: 0, type: "benefit" }, { weight: 0, type: "benefit" }]);
    expect(r.weights).toEqual([0.5, 0.5]);
    expect(r.scores.every(Number.isFinite)).toBe(true);
    expect(r.order[0]).toBe(1);
  });

  it("prefers values closest to the target for target criteria", () => {
    const r = topsis([[15], [45], [180]], [{ weight: 1, type: "target", target: 60 }]);
    expect(r.order).toEqual([1, 0, 2]);
  });

  it("scores 1 when every alternative is identical", () => {
    const r = topsis([[3, 3], [3, 3]], [{ weight: 1, type: "benefit" }, { weight: 1, type: "cost" }]);
    expect(r.scores).toEqual([1, 1]);
  });

  it("reproduces the legacy PHP ranking on the seed data (without its rounding bugs)", () => {
    const crit = seed.criteria;
    const games = seed.games as { name: string; values: Record<string, number> }[];
    // Direct port of hastop.php, minus round() calls.
    const sq: Record<string, number> = {};
    for (const c of crit) sq[c.key] = Math.sqrt(games.reduce((s, g) => s + g.values[c.key] ** 2, 0));
    const y = games.map((g) => crit.map((c) => (g.values[c.key] / sq[c.key]) * c.defaultWeight));
    const plus = crit.map((c, j) => (c.type === "benefit" ? Math.max : Math.min)(...y.map((r) => r[j])));
    const minus = crit.map((c, j) => (c.type === "benefit" ? Math.min : Math.max)(...y.map((r) => r[j])));
    const legacy = y.map((r) => {
      const dp = Math.sqrt(r.reduce((s, v, j) => s + (plus[j] - v) ** 2, 0));
      const dm = Math.sqrt(r.reduce((s, v, j) => s + (minus[j] - v) ** 2, 0));
      return dm / (dm + dp);
    });

    const r = topsis(
      games.map((g) => crit.map((c) => g.values[c.key])),
      crit.map((c) => ({ weight: c.defaultWeight, type: c.type as "benefit" | "cost" })),
    );
    r.scores.forEach((s, i) => expect(s).toBeCloseTo(legacy[i], 9));
  });
});

describe("topsisAbsolute", () => {
  it("scores against fixed ideals and applies penalties", () => {
    const r = topsisAbsolute([[0], [0], [0]], [[1, 1], [0, 0], [1, 0]], [1, 1], [1, 1, 0.5]);
    expect(r.fit).toEqual([1, 0, 0.5]);
    expect(r.scores).toEqual([1, 0, 0.25]);
    expect(r.order).toEqual([0, 2, 1]);
  });
  it("gives each alternative the same score regardless of the others", () => {
    const a = topsisAbsolute([[0]], [[0.3, 0.9]], [2, 1]).scores[0];
    const b = topsisAbsolute([[0], [0]], [[0.3, 0.9], [1, 0]], [2, 1]).scores[0];
    expect(a).toBeCloseTo(b, 15);
  });
});
