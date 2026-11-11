import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";
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
    <>
    <PageHero kicker={t.heroes.games.kicker} title={t.heroes.games.title} sub={t.heroes.games.sub}>
      {catalog.updatedAt && (
        <p className="mt-5 font-mono text-[13px] text-on-table-muted">{fmt(t.catalog.updated, { date: formatDate(t, catalog.updatedAt) })}</p>
      )}
    </PageHero>
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
      <CatalogTable catalog={{ ...catalog, games: catalog.games.map((g) => ({ ...g, description: null })) }} t={t} lang={lang} />
    </div>
    </>
  );
}
