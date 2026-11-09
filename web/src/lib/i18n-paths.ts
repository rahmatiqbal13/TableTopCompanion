import type { Locale } from "@/i18n";
import { gameSlug } from "./format";
import type { Post, PostText, LocalListing, LocalText } from "./types";

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

export const listingHref = (lang: Locale, l: Pick<LocalListing, "kind" | "slug">) => href(lang, `/local/${l.kind}/${l.slug}`);

/** The listing's text in `lang`, else the other language, else blank. */
export function listingText(l: Pick<LocalListing, "text">, lang: Locale): { text: LocalText; lang: Locale } {
  const other: Locale = lang === "id" ? "en" : "id";
  if (l.text[lang]) return { text: l.text[lang], lang };
  return { text: l.text[other] ?? { summary: "", schedule: "", body: "" }, lang: other };
}
