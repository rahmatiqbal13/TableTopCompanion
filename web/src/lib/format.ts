import { fmt, type Dict } from "@/i18n";
import { PLAYER_FIT, TASTE, type Reason } from "./recommend";
import type { Criterion, Genre } from "./types";

const dec = (x: number, digits: number, intl: string) =>
  x.toLocaleString(intl, { minimumFractionDigits: digits, maximumFractionDigits: digits });

export function criterionName(t: Dict, c: Criterion): string {
  return t.criteria[c.key]?.name ?? c.name;
}

export function criterionHint(t: Dict, c: Criterion): string {
  return t.criteria[c.key]?.hint ?? c.hint;
}

export function genreName(t: Dict, g: Genre | undefined): string {
  return g ? (t.genres[g.name] ?? g.name) : "";
}

export function formatValue(t: Dict, c: Criterion, value: number): string {
  switch (c.key) {
    case "minPlayers": return fmt(t.units.players, { v: value });
    case "rating": return fmt(t.units.rating, { v: dec(value, 1, t.intl) });
    case "complexity": return fmt(t.units.complexity, { v: dec(value, 1, t.intl) });
    case "playTime": return fmt(t.units.minutes, { v: value });
    case "minAge": return fmt(t.units.age, { v: value });
    case PLAYER_FIT:
    case TASTE: return `${Math.round(value * 100)}%`;
    default: return `${Number.isInteger(value) ? value : dec(value, 2, t.intl)} ${c.unit}`.trim();
  }
}

export function reasonText(t: Dict, r: Reason, c: Criterion): string {
  return fmt(t.reasons[r.code] ?? r.code, {
    v: r.value === undefined ? "" : formatValue(t, c, r.value),
    crit: criterionName(t, c),
    n: r.n ?? "",
    name: r.name ?? "",
    shared: r.shared?.length ? ` (${r.shared.join(", ")})` : "",
  });
}

export function formatDate(t: Dict, iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(t.intl, { day: "numeric", month: "long", year: "numeric" }) : "";
}

export function slugify(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const gameSlug = (g: { id: number; name: string }) => `${g.id}-${slugify(g.name)}`;
