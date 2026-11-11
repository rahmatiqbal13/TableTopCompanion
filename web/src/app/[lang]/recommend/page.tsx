import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MethodBox } from "@/components/method-box";
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
      <Suspense fallback={<div className="table-surface h-[640px]" />}>
        <Recommender catalog={catalog} t={t} lang={lang} />
      </Suspense>
      <MethodBox t={t} lang={lang} />
    </>
  );
}
