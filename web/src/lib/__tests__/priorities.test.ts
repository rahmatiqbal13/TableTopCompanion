import { describe, expect, it } from "vitest";
import seed from "../../data/seed.json";
import { applyAnswer, applyOrder, importancesFromOrder, orderFromCriteria, QUESTIONS, rocWeights, selectedOption } from "../priorities";
import { adminDefaults } from "../recommend";
import type { Criterion } from "../types";

const criteria = adminDefaults(seed.criteria as Criterion[]);
const keys = Object.keys(criteria);

describe("quick questions", () => {
  it("every answer is detected as selected after applying it", () => {
    for (const q of QUESTIONS) for (const o of q.options) {
      expect(selectedOption(applyAnswer(criteria, q, o.id), q)).toBe(o.id);
    }
  });
  it("only touches the criterion the question is about", () => {
    const q = QUESTIONS.find((x) => x.id === "weight")!;
    const next = applyAnswer(criteria, q, "deep");
    for (const k of keys) if (k !== "complexity") expect(next[k]).toEqual(criteria[k]);
    expect(next.complexity).toEqual({ importance: 7, type: "benefit" });
  });
  it("shows no answer when the sliders don't match one", () => {
    expect(selectedOption({ ...criteria, playTime: { importance: 3, type: "cost" } }, QUESTIONS[0])).toBeNull();
  });
});

describe("rank order centroid", () => {
  it("weights sum to 1 and strictly decrease", () => {
    for (const n of [1, 3, 7]) {
      const w = rocWeights(n);
      expect(w.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      for (let i = 1; i < n; i++) expect(w[i]).toBeLessThan(w[i - 1]);
    }
    expect(rocWeights(3).map((x) => +x.toFixed(4))).toEqual([0.6111, 0.2778, 0.1111]);
  });
  it("maps an order to importances: top = 10, unranked = 0, never below 1", () => {
    const imp = importancesFromOrder(["rating", "playTime", "complexity"], keys);
    expect(imp).toMatchObject({ rating: 10, playTime: 5, complexity: 2, minAge: 0, minPlayers: 0 });
  });
  it("keeps directions and targets, and round-trips the order", () => {
    const start = { ...criteria, playTime: { importance: 4, type: "target" as const, target: 45 } };
    const next = applyOrder(start, ["complexity", "playTime", "rating"], keys);
    expect(next.playTime).toEqual({ importance: 5, type: "target", target: 45 });
    expect(orderFromCriteria(next, keys)).toEqual(["complexity", "playTime", "rating"]);
  });
});
