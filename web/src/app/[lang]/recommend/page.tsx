import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Recommender } from "@/components/recommender";
import { getDict, hasLocale } from "@/i18n";
import { getCatalog } from "@/lib/data";
import type { Catalog } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/recommend">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return { title: t.rec.title, description: t.rec.subtitle, alternates: { languages: { id: "/id/recommend", en: "/en/recommend" } } };
}

export default async function RecommendPage({ params }: PageProps<"/[lang]/recommend">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const full = await getCatalog();
  // Descriptions are not needed for ranking; keep the client payload small.
  const catalog: Catalog = { ...full, games: full.games.map((g) => ({ ...g, description: null })) };
  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-6 pt-10">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t.rec.title}</h1>
        <p className="mt-2 max-w-2xl text-muted">{t.rec.subtitle}</p>
      </section>
      <Suspense fallback={<div className="mx-auto h-96 max-w-6xl animate-pulse rounded-2xl bg-sunken" />}>
        <Recommender catalog={catalog} t={t} lang={lang} />
      </Suspense>
    </>
  );
}
