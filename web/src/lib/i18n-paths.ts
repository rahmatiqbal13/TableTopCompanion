import type { Locale } from "@/i18n";
import { gameSlug } from "./format";
import type { Post, PostText } from "./types";

export const href = (lang: Locale, path = "") => `/${lang}${path}`;
export const gameHref = (lang: Locale, g: { id: number; name: string }) => href(lang, `/games/${gameSlug(g)}`);
export const postHref = (lang: Locale, p: Pick<Post, "type" | "slug">) => href(lang, `/${p.type}/${p.slug}`);

/** The post text in `lang`, falling back to the other language. */
export function postText(p: Post, lang: Locale): { text: PostText; lang: Locale; fallback: boolean } {
  const own = p.text[lang];
  if (own?.title) return { text: own, lang, fallback: false };
  const other: Locale = lang === "id" ? "en" : "id";
  return { text: p.text[other] ?? { title: p.slug, excerpt: "", body: "" }, lang: other, fallback: true };
}
