import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCard, PostCard } from "@/components/cards";
import { SectionHeading } from "@/components/ui";
import { fmt, getDict, hasLocale } from "@/i18n";
import { getCatalog, getPublishedPosts } from "@/lib/data";
import { href } from "@/lib/i18n-paths";
import { defaultPreferences, PRESETS, toSearchParams } from "@/lib/recommend";
import type { PostType } from "@/lib/types";

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const [catalog, posts] = await Promise.all([getCatalog(), getPublishedPosts()]);
  const byType = (type: PostType, n: number) => posts.filter((p) => p.type === type).slice(0, n);
  const reviews = byType("reviews", 3), videos = byType("videos", 3), news = byType("news", 4), guides = byType("guides", 3);

  const brain = defaultPreferences(catalog);
  brain.criteria = PRESETS.find((p) => p.id === "brainburner")!.criteria(catalog.criteria);
  const quick: [string, string][] = [
    [t.home.quick.party, "players=6&time=60"],
    [t.home.quick.family, "players=4&age=6"],
    [t.home.quick.duo, "players=2"],
    [t.home.quick.short, "time=30"],
    [t.home.quick.heavy, toSearchParams(brain, catalog).toString()],
  ];
  const topRated = [...catalog.games].sort((a, b) => b.values.rating - a.values.rating).slice(0, 6);
  const genres = new Map(catalog.genres.map((g) => [g.id, g]));

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 pb-20 pt-10">
      <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-felt">{t.home.kicker}</p>
          <h1 className="mt-2 font-display text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">{t.home.title}</h1>
          <p className="mt-4 max-w-xl text-lg text-muted">{fmt(t.home.subtitle, { n: catalog.games.length })}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={href(lang, "/recommend")} className="rounded-xl bg-felt px-5 py-3 font-medium text-on-felt hover:opacity-90">{t.home.ctaFind}</Link>
            <Link href={href(lang, "/games")} className="rounded-xl border border-line bg-card px-5 py-3 font-medium hover:bg-sunken">{t.home.ctaBrowse}</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-card p-5">
          <h2 className="font-display text-lg font-semibold">{t.home.quickTitle}</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {quick.map(([label, qs]) => (
              <li key={label}>
                <Link href={`${href(lang, "/recommend")}?${qs}`} className="block rounded-full border border-line bg-paper px-3.5 py-1.5 text-sm hover:border-felt hover:text-felt">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {reviews.length > 0 && (
        <section>
          <SectionHeading title={t.home.latestReviews} action={<SeeAll href={href(lang, "/reviews")} label={t.home.seeAll} />} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((p, i) => <PostCard key={p.id} post={p} lang={lang} t={t} size={i === 0 ? "lg" : "md"} />)}
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section>
          <SectionHeading title={t.home.latestVideos} action={<SeeAll href={href(lang, "/videos")} label={t.home.seeAll} />} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} />)}
          </div>
        </section>
      )}

      {(news.length > 0 || guides.length > 0) && (
        <section className={`grid gap-12 ${news.length && guides.length ? "lg:grid-cols-2" : ""}`}>
          {news.length > 0 && (
            <div>
              <SectionHeading title={t.home.latestNews} action={<SeeAll href={href(lang, "/news")} label={t.home.seeAll} />} />
              <div className={`grid gap-6 sm:grid-cols-2 ${guides.length ? "" : "lg:grid-cols-4"}`}>{news.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} />)}</div>
            </div>
          )}
          {guides.length > 0 && (
            <div>
              <SectionHeading title={t.home.guides} action={<SeeAll href={href(lang, "/guides")} label={t.home.seeAll} />} />
              <div className={`grid gap-6 sm:grid-cols-2 ${news.length ? "" : "lg:grid-cols-3"}`}>{guides.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} />)}</div>
            </div>
          )}
        </section>
      )}

      <section>
        <SectionHeading title={t.home.topRated} action={<SeeAll href={href(lang, "/games")} label={t.home.seeAll} />} />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {topRated.map((g) => <GameCard key={g.id} game={g} genre={genres.get(g.genreId)} lang={lang} t={t} />)}
        </div>
      </section>
    </div>
  );
}

function SeeAll({ href: to, label }: { href: string; label: string }) {
  return <Link href={to} className="text-sm text-muted underline hover:text-ink">{label} →</Link>;
}
