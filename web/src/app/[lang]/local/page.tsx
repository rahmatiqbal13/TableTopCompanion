import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";
import { fmt, getDict, hasLocale, locales } from "@/i18n";
import { getPublishedListings } from "@/lib/data";
import { href } from "@/lib/i18n-paths";
import { LOCAL_KINDS } from "@/lib/types";

export async function generateMetadata({ params }: PageProps<"/[lang]/local">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return { title: t.local.title, description: t.local.intro, alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}/local`])) } };
}

export default async function LocalHub({ params }: PageProps<"/[lang]/local">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const listings = await getPublishedListings();
  return (
    <>
    <PageHero kicker={t.heroes.local.kicker} title={t.heroes.local.title} sub={t.local.intro} />
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-12">
      <div className="grid gap-6 md:grid-cols-3">
        {LOCAL_KINDS.map((kind) => {
          const n = listings.filter((l) => l.kind === kind).length;
          return (
            <Link key={kind} href={href(lang, `/local/${kind}`)} className="group rounded-[18px] border border-line bg-card p-6">
              <p className="font-mono text-xs text-muted">{fmt(t.local.count, { n })}</p>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-[-0.02em] group-hover:underline">{t.local.types[kind].title}</h2>
              <p className="mt-2 text-sm text-muted">{t.local.types[kind].intro}</p>
            </Link>
          );
        })}
      </div>
    </div>
    </>
  );
}
