import type { CriterionType } from "./types";

export interface TopsisCriterion {
  weight: number;
  type: CriterionType;
  /** Required for type "target": the ideal raw value. */
  target?: number;
}

export interface TopsisResult {
  /** Weights normalized to sum to 1 (equal weights if all are zero). */
  weights: number[];
  /** Matrix after target criteria are turned into |x - target| deviations. */
  decision: number[][];
  normalized: number[][];
  weighted: number[][];
  idealBest: number[];
  idealWorst: number[];
  dPlus: number[];
  dMinus: number[];
  /** Relative closeness to the ideal solution, 0..1 (higher is better). */
  scores: number[];
  /** Competition ranking per alternative (ties share a rank: 1, 1, 3). */
  ranks: number[];
  /** Alternative indices sorted best-first. */
  order: number[];
  /**
   * Per alternative and criterion: 0 = equals the worst value, 1 = equals the best.
   * 0.5 when the criterion does not separate the alternatives (all values equal).
   */
  closeness: number[][];
}

const EPS = 1e-12;

/**
 * TOPSIS (Hwang & Yoon, 1981) with vector normalization.
 *
 * Fixes compared with the legacy PHP version:
 *  - no rounding between steps (it skewed close scores),
 *  - numeric sorting and tie-aware ranks (it sorted floats as strings),
 *  - per-alternative division guard (it checked only the first alternative),
 *  - zero-norm columns and zero total weight cannot cause division by zero.
 *
 * Extension: a "target" criterion prefers values close to `target`. It is
 * converted to a cost criterion on the absolute deviation |x - target|.
 */
export function topsis(matrix: number[][], criteria: TopsisCriterion[]): TopsisResult {
  const m = matrix.length;
  const n = criteria.length;
  for (const row of matrix) {
    if (row.length !== n) throw new Error("Every row must have one value per criterion");
  }

  const rawWeights = criteria.map((c) => (Number.isFinite(c.weight) && c.weight > 0 ? c.weight : 0));
  const total = rawWeights.reduce((a, b) => a + b, 0);
  const weights = total > 0 ? rawWeights.map((w) => w / total) : rawWeights.map(() => 1 / n);

  const isBenefit = criteria.map((c) => c.type === "benefit");
  const decision = matrix.map((row) =>
    row.map((x, j) => {
      const c = criteria[j];
      if (c.type !== "target") return x;
      if (c.target === undefined || !Number.isFinite(c.target)) {
        throw new Error(`Criterion ${j} is a target criterion without a target value`);
      }
      return Math.abs(x - c.target);
    }),
  );

  const norms = Array.from({ length: n }, (_, j) =>
    Math.sqrt(decision.reduce((sum, row) => sum + row[j] * row[j], 0)),
  );
  const normalized = decision.map((row) => row.map((x, j) => (norms[j] > EPS ? x / norms[j] : 0)));
  const weighted = normalized.map((row) => row.map((r, j) => r * weights[j]));

  const colMax = Array.from({ length: n }, (_, j) => Math.max(...weighted.map((r) => r[j])));
  const colMin = Array.from({ length: n }, (_, j) => Math.min(...weighted.map((r) => r[j])));
  const idealBest = isBenefit.map((b, j) => (b ? colMax[j] : colMin[j]));
  const idealWorst = isBenefit.map((b, j) => (b ? colMin[j] : colMax[j]));

  const dist = (row: number[], ref: number[]) =>
    Math.sqrt(row.reduce((sum, y, j) => sum + (y - ref[j]) ** 2, 0));
  const dPlus = weighted.map((row) => dist(row, idealBest));
  const dMinus = weighted.map((row) => dist(row, idealWorst));

  // If an alternative is both the best and the worst (all alternatives are
  // identical), it is as good as the set allows: score 1.
  const scores = dPlus.map((dp, i) => (dp + dMinus[i] > EPS ? dMinus[i] / (dp + dMinus[i]) : 1));

  const order = Array.from({ length: m }, (_, i) => i).sort((a, b) => scores[b] - scores[a] || a - b);
  const ranks = new Array<number>(m);
  order.forEach((idx, pos) => {
    const prev = order[pos - 1];
    ranks[idx] = pos > 0 && Math.abs(scores[prev] - scores[idx]) < 1e-9 ? ranks[prev] : pos + 1;
  });

  const closeness = weighted.map((row) =>
    row.map((y, j) => {
      const span = idealBest[j] - idealWorst[j];
      return Math.abs(span) > EPS ? (y - idealWorst[j]) / span : 0.5;
    }),
  );

  return { weights, decision, normalized, weighted, idealBest, idealWorst, dPlus, dMinus, scores, ranks, order, closeness };
}
