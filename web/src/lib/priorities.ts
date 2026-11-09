import type { CriterionPref } from "./recommend";

/*
 * Simple ways to set priorities without sliders. Both write the same
 * `prefs.criteria` record the sliders use, so the modes stay in sync.
 */

// ---------------------------------------------------------------------------
// Quick questions: each answer sets one criterion.
// ---------------------------------------------------------------------------

export interface QuestionOption {
  id: string;
  /** Criterion key -> preference this answer sets. */
  set: Record<string, CriterionPref>;
}

export interface Question {
  /** Dictionary key under rec.questions. */
  id: "length" | "weight" | "crowd" | "ages";
  options: QuestionOption[];
}

export const QUESTIONS: Question[] = [
  {
    id: "length",
    options: [
      { id: "quick", set: { playTime: { importance: 7, type: "target", target: 20 } } },
      { id: "evening", set: { playTime: { importance: 7, type: "target", target: 60 } } },
      { id: "long", set: { playTime: { importance: 6, type: "benefit" } } },
    ],
  },
  {
    id: "weight",
    options: [
      { id: "light", set: { complexity: { importance: 7, type: "cost" } } },
      { id: "medium", set: { complexity: { importance: 6, type: "target", target: 2.5 } } },
      { id: "deep", set: { complexity: { importance: 7, type: "benefit" } } },
    ],
  },
  {
    id: "crowd",
    options: [
      { id: "alot", set: { rating: { importance: 9, type: "benefit" } } },
      { id: "some", set: { rating: { importance: 5, type: "benefit" } } },
      { id: "little", set: { rating: { importance: 2, type: "benefit" } } },
    ],
  },
  {
    id: "ages",
    options: [
      { id: "kids", set: { minAge: { importance: 8, type: "cost" } } },
      { id: "teens", set: { minAge: { importance: 4, type: "cost" } } },
      { id: "adults", set: { minAge: { importance: 0, type: "cost" } } },
    ],
  },
];

const same = (a: CriterionPref | undefined, b: CriterionPref) =>
  a?.importance === b.importance && a.type === b.type && (a.target ?? null) === (b.target ?? null);

/** The option whose settings match the current criteria, if any (so answers stay in sync with the sliders). */
export function selectedOption(criteria: Record<string, CriterionPref>, q: Question): string | null {
  return q.options.find((o) => Object.entries(o.set).every(([k, v]) => same(criteria[k], v)))?.id ?? null;
}

/** Applies an answer; criteria the catalog doesn't have are ignored. */
export function applyAnswer(criteria: Record<string, CriterionPref>, q: Question, optionId: string): Record<string, CriterionPref> {
  const option = q.options.find((o) => o.id === optionId);
  if (!option) return criteria;
  const next = { ...criteria };
  for (const [k, v] of Object.entries(option.set)) if (k in next) next[k] = { ...v };
  return next;
}

// ---------------------------------------------------------------------------
// Ranking: the user orders criteria; rank-order centroid (ROC) turns the
// order into weights: w_k = (1/n) · Σ_{i=k..n} 1/i. It is the standard way to
// get weights from a ranking alone and favours the top items strongly.
// ---------------------------------------------------------------------------

export function rocWeights(n: number): number[] {
  return Array.from({ length: n }, (_, k) => {
    let s = 0;
    for (let i = k + 1; i <= n; i++) s += 1 / i;
    return s / n;
  });
}

/** Importance 1..10 for each ranked key (top = 10); keys not ranked are switched off (0). */
export function importancesFromOrder(order: string[], allKeys: string[]): Record<string, number> {
  const w = rocWeights(order.length);
  const out: Record<string, number> = Object.fromEntries(allKeys.map((k) => [k, 0]));
  order.forEach((k, i) => { out[k] = Math.max(1, Math.round((10 * w[i]) / w[0])); });
  return out;
}

/** Current order implied by the criteria: switched-on keys, most important first (stable for ties). */
export function orderFromCriteria(criteria: Record<string, CriterionPref>, keys: string[]): string[] {
  return keys
    .filter((k) => (criteria[k]?.importance ?? 0) > 0)
    .map((k, i) => ({ k, i, w: criteria[k].importance }))
    .sort((a, b) => b.w - a.w || a.i - b.i)
    .map((x) => x.k);
}

/** Applies a new order: importances from ROC, directions and targets unchanged. */
export function applyOrder(criteria: Record<string, CriterionPref>, order: string[], keys: string[]): Record<string, CriterionPref> {
  const imp = importancesFromOrder(order, keys);
  return Object.fromEntries(keys.map((k) => [k, { ...criteria[k], importance: imp[k] }]));
}
