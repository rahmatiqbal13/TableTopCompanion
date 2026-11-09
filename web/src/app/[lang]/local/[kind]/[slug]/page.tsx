import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Cover } from "@/components/cover";
import { Markdown } from "@/components/markdown";
import { PageSkeleton } from "@/components/ui";
import { getDict, hasLocale, locales } from "@/i18n";
import { getCatalog, getPublishedListings } from "@/lib/data";
import { gameHref, href, listingHref, listingText } from "@/lib/i18n-paths";
import { isLocalKind, LOCAL_KINDS } from "@/lib/types";

type Props = PageProps<"/[lang]/local/[kind]/[slug]">;

export async function generateStaticParams() {
  const listings = await getPublishedListings();
  // Cache Components needs at least one param to validate the route; the placeholder 404s.
  return listings.length ? listings.map((l) => ({ kind: l.kind, slug: l.slug })) : LOCAL_KINDS.map((kind) => ({ kind, slug: "__none__" }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, kind, slug } = await params;
  if (!hasLocale(lang)) return {};
  const listing = (await getPublishedListings()).find((l) => l.kind === kind && l.slug === slug);
  if (!listing) return {};
  return {
    title: listing.name,
    description: listingText(listing, lang).text.summary,
    alternates: { canonical: listingHref(lang, listing), languages: Object.fromEntries(locales.map((l) => [l, `/${l}/local/${kind}/${slug}`])) },
    openGraph: { title: listing.name, images: listing.imageUrl ? [listing.imageUrl] : undefined },
  };
}

// The slug is URL data: stream it so client navigation to new listings stays instant.
export default function LocalDetailPage({ params }: Props) {
  return <Suspense fallback={<PageSkeleton />}><Detail params={params} /></Suspense>;
}

async function Detail({ params }: Pick<Props, "params">) {
  const { lang, kind, slug } = await params;
  if (!hasLocale(lang) || !isLocalKind(kind)) notFound();
  const listing = (await getPublishedListings()).find((l) => l.kind === kind && l.slug === slug);
  if (!listing) notFound();
  const t = getDict(lang);
  const { text, lang: textLang } = listingText(listing, lang);
  const game = listing.gameId === null ? undefined : (await getCatalog()).games.find((g) => g.id === listing.gameId);

  const external = "text-felt underline underline-offset-2";
  const facts: [string, React.ReactNode][] = [];
  if (listing.designer) facts.push([t.local.designer, listing.designer]);
  if (text.schedule) facts.push([t.local.schedule, <span key="s" lang={textLang}>{text.schedule}</span>]);
  if (listing.address) facts.push([t.local.address, listing.address]);
  if (listing.contact) facts.push([t.local.contact, listing.contact]);

  const links: [string, string | null][] = [[t.local.map, listing.mapUrl], [t.local.website, listing.websiteUrl], [t.local.instagram, listing.instagramUrl]];

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <Link href={href(lang, `/local/${kind}`)} className="text-sm text-muted underline">← {t.local.types[kind].title}</Link>
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
        <article className="min-w-0">
          {listing.city && <p className="font-mono text-xs uppercase tracking-[0.12em] text-felt">{listing.city}</p>}
          <h1 className="mt-2 font-display text-4xl font-bold leading-[1.05] tracking-[-0.03em] sm:text-5xl">{listing.name}</h1>
          {text.summary && <p lang={textLang} className="mt-4 text-lg text-muted">{text.summary}</p>}
          <div className="mt-8 aspect-[16/10] overflow-hidden rounded-[18px]">
            <Cover name={listing.name} src={listing.imageUrl} fillText={120} />
          </div>
          {text.body && <div lang={textLang} className="mt-8"><Markdown source={text.body} playLabel={listing.name} /></div>}
        </article>
        <aside className="h-fit rounded-[18px] border border-line bg-card p-6 lg:sticky lg:top-4">
          {facts.length > 0 && (
            <dl className="space-y-4 text-[15px]">
              {facts.map(([label, value]) => (
                <div key={label}>
                  <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
            </dl>
          )}
          <ul className={`space-y-2 text-[15px] ${facts.length ? "mt-5 border-t border-line pt-5" : ""}`}>
            {links.filter(([, url]) => url).map(([label, url]) => (
              <li key={label}><a href={url!} target="_blank" rel="noreferrer" className={external}>{label} ↗</a></li>
            ))}
            {game && <li><Link href={gameHref(lang, game)} className={external}>{t.local.catalog} →</Link></li>}
          </ul>
        </aside>
      </div>
    </div>
  );
}
