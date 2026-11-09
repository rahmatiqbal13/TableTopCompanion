import type { MetadataRoute } from "next";
import { locales } from "@/i18n";
import { getCatalog, getPublishedListings, getPublishedPosts } from "@/lib/data";
import { gameSlug } from "@/lib/format";
import { LOCAL_KINDS, POST_TYPES } from "@/lib/types";

const base = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [catalog, posts, listings] = await Promise.all([getCatalog(), getPublishedPosts(), getPublishedListings()]);
  const entry = (path: string, lastModified?: string): MetadataRoute.Sitemap[number] => ({
    url: `${base}/${locales[0]}${path}`,
    lastModified,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `${base}/${l}${path}`])) },
  });
  return [
    entry(""), entry("/recommend"), entry("/games"), entry("/method"),
    ...POST_TYPES.map((type) => entry(`/${type}`)),
    ...posts.map((p) => entry(`/${p.type}/${p.slug}`, p.updatedAt)),
    ...catalog.games.map((g) => entry(`/games/${gameSlug(g)}`)),
    entry("/local"),
    ...LOCAL_KINDS.map((kind) => entry(`/local/${kind}`)),
    ...listings.map((l) => entry(`/local/${l.kind}/${l.slug}`, l.updatedAt)),
  ];
}
