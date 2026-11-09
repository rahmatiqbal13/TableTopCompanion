import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LocalBrowser } from "@/components/local-browser";
import { PageSkeleton } from "@/components/ui";
import { getDict, hasLocale, locales } from "@/i18n";
import { getPublishedListings } from "@/lib/data";
import { href } from "@/lib/i18n-paths";
import { isLocalKind, LOCAL_KINDS } from "@/lib/types";

export function generateStaticParams() {
  return LOCAL_KINDS.map((kind) => ({ kind }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/local/[kind]">): Promise<Metadata> {
  const { lang, kind } = await params;
  if (!hasLocale(lang) || !isLocalKind(kind)) return {};
  const s = getDict(lang).local.types[kind];
  return { title: s.title, description: s.intro, alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}/local/${kind}`])) } };
}

// The section is URL data: an unknown one is only known at request time.
export default function LocalSectionPage({ params }: PageProps<"/[lang]/local/[kind]">) {
  return <Suspense fallback={<PageSkeleton />}><LocalSection params={params} /></Suspense>;
}

async function LocalSection({ params }: Pick<PageProps<"/[lang]/local/[kind]">, "params">) {
  const { lang, kind } = await params;
  if (!hasLocale(lang) || !isLocalKind(kind)) notFound();
  const t = getDict(lang);
  const listings = (await getPublishedListings()).filter((l) => l.kind === kind);
  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <Link href={href(lang, "/local")} className="text-sm text-muted underline">← {t.local.title}</Link>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">{t.local.types[kind].title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{t.local.types[kind].intro}</p>
      {listings.length ? (
        <LocalBrowser listings={listings} lang={lang} allCities={t.local.allCities} />
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t.local.empty}</p>
      )}
    </div>
  );
}
