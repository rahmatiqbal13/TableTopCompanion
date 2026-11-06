import { en, type Dict } from "./en";
import { id } from "./id";

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "id";
export const LOCALE_COOKIE = "NEXT_LOCALE";

const dicts: Record<Locale, Dict> = { id, en };

export const hasLocale = (x: string): x is Locale => (locales as readonly string[]).includes(x);
export const getDict = (lang: Locale): Dict => dicts[lang];
export const otherLocale = (lang: Locale): Locale => (lang === "id" ? "en" : "id");

/** Fills {placeholders} in a dictionary string. */
export function fmt(template: string, vars: Record<string, string | number> = {}): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

export type { Dict };
