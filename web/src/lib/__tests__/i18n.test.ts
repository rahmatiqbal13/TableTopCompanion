import { describe, expect, it } from "vitest";
import { en } from "@/i18n/en";
import { id } from "@/i18n/id";
import { fmt } from "@/i18n";
import { postText } from "../i18n-paths";
import { gameSlug, slugify } from "../format";
import type { Post } from "../types";

/** Every leaf key path of a nested object. */
const paths = (o: unknown, prefix = ""): string[] =>
  o && typeof o === "object" && !Array.isArray(o)
    ? Object.entries(o).flatMap(([k, v]) => paths(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

describe("dictionaries", () => {
  it("Indonesian has every English key (except optional genre names)", () => {
    const idKeys = new Set(paths(id));
    expect(paths(en).filter((k) => !idKeys.has(k) && !k.startsWith("genres"))).toEqual([]);
  });
  it("placeholders match between languages", () => {
    const vars = (s: unknown) => (typeof s === "string" ? (s.match(/\{\w+\}/g) ?? []).sort() : []);
    const get = (o: unknown, p: string) => p.split(".").reduce<unknown>((x, k) => (x as Record<string, unknown>)?.[k], o);
    for (const p of paths(en)) expect([p, vars(get(id, p))]).toEqual([p, vars(get(en, p))]);
  });
  it("fmt fills placeholders and leaves unknown ones", () => {
    expect(fmt("{n} of {total}", { n: 3, total: 9 })).toBe("3 of 9");
    expect(fmt("{x}")).toBe("{x}");
  });
});

describe("slugs and fallbacks", () => {
  it("slugifies names with accents and punctuation", () => {
    expect(slugify("Koryŏ")).toBe("koryo");
    expect(gameSlug({ id: 7, name: "Conflict of Heroes: Awakening the Bear! – Russia 1941-1942" }))
      .toBe("7-conflict-of-heroes-awakening-the-bear-russia-1941-1942");
  });
  it("falls back to the other language", () => {
    const post = { slug: "x", text: { id: { title: "Judul", excerpt: "", body: "" } } } as unknown as Post;
    expect(postText(post, "en")).toMatchObject({ lang: "id", fallback: true });
    expect(postText(post, "id")).toMatchObject({ lang: "id", fallback: false });
  });
});
