import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogTable } from "@/components/catalog-table";
import { fmt, getDict, hasLocale } from "@/i18n";
import { getCatalog } from "@/lib/data";
import { formatDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/[lang]/games">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDict(lang).catalog.title, alternates: { languages: { id: "/id/games", en: "/en/games" } } };
}

export default async function GamesPage({ params }: PageProps<"/[lang]/games">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const catalog = await getCatalog();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t.catalog.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {fmt(t.catalog.count, { n: catalog.games.length })}
        {catalog.updatedAt && ` · ${fmt(t.catalog.updated, { date: formatDate(t, catalog.updatedAt) })}`}
      </p>
      <CatalogTable catalog={{ ...catalog, games: catalog.games.map((g) => ({ ...g, description: null })) }} t={t} lang={lang} />
    </div>
  );
}
