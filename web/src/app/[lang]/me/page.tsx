import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MyGames } from "@/components/my-games";
import { getDict, hasLocale } from "@/i18n";
import { getCatalog } from "@/lib/data";

export async function generateMetadata({ params }: PageProps<"/[lang]/me">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDict(lang).auth.myGames, robots: { index: false } };
}

export default async function MePage({ params }: PageProps<"/[lang]/me">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const catalog = await getCatalog();
  // The page itself is static; your shelf loads in the browser.
  const games = catalog.games.map(({ id, name, year, imageUrl }) => ({ id, name, year, imageUrl }));
  return (
    <div className="mx-auto max-w-4xl px-4 pb-20 pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t.auth.myGames}</h1>
      <p className="mt-2 mb-8 text-muted">{t.me.intro}</p>
      <MyGames games={games} t={t} lang={lang} />
    </div>
  );
}
