import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { GameCard, PostCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { GameUserPanel } from "@/components/game-user-panel";
import { PageSkeleton, SectionHeading } from "@/components/ui";
import { VideoPlayer } from "@/components/video-player";
import { fmt, getDict, hasLocale, locales, type Dict } from "@/i18n";
import { getCatalog, getPublishedPosts } from "@/lib/data";
import { gameSlug, genreName } from "@/lib/format";
import { gameHref, href, postHref, postText } from "@/lib/i18n-paths";
import { similarityFor } from "@/lib/recommend";
import { isPortrait, postThumb, postVideo } from "@/lib/video";
import type { Catalog, Game } from "@/lib/types";

export async function generateStaticParams() {
  const catalog = await getCatalog();
  return catalog.games.map((g) => ({ slug: gameSlug(g) }));
}

async function load(slug: string): Promise<{ catalog: Catalog; game: Game } | null> {
  const catalog = await getCatalog();
  const id = Number.parseInt(slug, 10);
  const game = catalog.games.find((g) => g.id === id);
  return game ? { catalog, game } : null;
}

export async function generateMetadata({ params }: PageProps<"/[lang]/games/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const found = hasLocale(lang) ? await load(slug) : null;
  if (!found) return {};
  const { game } = found;
  const canonical = gameSlug(game);
  return {
    title: game.name,
    description: game.description?.slice(0, 160) ?? `${game.name} (${game.year})`,
    alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}/games/${canonical}`])) },
    openGraph: game.imageUrl ? { images: [game.imageUrl] } : undefined,
  };
}

// The slug is URL data: stream the page behind a placeholder so client
// navigation to games added after the build stays instant.
export default function GamePage({ params }: PageProps<"/[lang]/games/[slug]">) {
  return <Suspense fallback={<PageSkeleton />}><GameHub params={params} /></Suspense>;
}

async function GameHub({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const found = await load(slug);
  if (!found) notFound();
  const { catalog, game } = found;
  if (slug !== gameSlug(game)) permanentRedirect(gameHref(lang, game));

  const t = getDict(lang);
  const posts = (await getPublishedPosts()).filter((p) => p.gameIds.includes(game.id));
  const review = posts.find((p) => p.type === "reviews");
  const videos = posts.filter((p) => postVideo(p));
  const related = posts.filter((p) => p !== review && !postVideo(p));
  const genres = new Map(catalog.genres.map((g) => [g.id, g]));

  const sim = similarityFor(catalog.games);
  const similar = catalog.games
    .filter((g) => g.id !== game.id)
    .map((g) => ({ g, s: sim.similarity(game, g) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((x) => x.g);

  // The Wikidata import ends a borrowed description with "Wikipedia: <url>" for the credit line.
  const credit = game.description?.match(/\n*Wikipedia: (https:\/\/\S+)\s*$/);
  const about = game.description ? { text: credit ? game.description.slice(0, credit.index).trim() : game.description, source: credit?.[1] ?? null } : null;
  const v = game.values;
  const num = (x: number | undefined, d: number) => x?.toLocaleString(t.intl, { minimumFractionDigits: d, maximumFractionDigits: d });
  const bgg = game.linkUrl ?? (game.bggId
    ? `https://boardgamegeek.com/boardgame/${game.bggId}`
    : `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(game.name)}`);

  return (
    <>
    <section className="table-surface relative overflow-hidden text-on-table">
      <div aria-hidden className="table-vignette pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4 pb-12 pt-7">
        <Link href={href(lang, "/games")} className="text-sm text-on-table-muted hover:text-on-table">← {t.game.back}</Link>
        <header className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_40px_-18px_rgba(0,0,0,0.55)]"><Cover name={game.name} src={game.imageUrl} size={160} /></div>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-table-gold">
              {genreName(t, genres.get(game.genreId))} · {game.year}
              {game.bggRank && ` · ${fmt(t.game.bggRank, { n: game.bggRank })}`}
            </p>
            <h1 className="mt-3 text-balance font-display text-[clamp(40px,6vw,76px)] font-bold leading-[0.95] tracking-[-0.045em]">{game.name}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`${href(lang, "/recommend")}?fav=${game.id}`} className="min-h-11 content-center rounded-full bg-on-table px-5 py-2.5 text-sm font-semibold text-table-ink hover:opacity-90">
                {t.game.findSimilar}
              </Link>
              <a href={bgg} target="_blank" rel="noreferrer" className="min-h-11 content-center rounded-full border border-on-table/30 bg-black/15 px-5 py-2.5 text-sm font-medium text-on-table hover:bg-on-table/15">
                {t.game.viewBgg} ↗
              </a>
            </div>
          </div>
          {review?.score != null && (
            <div className="grid size-24 shrink-0 place-items-center rounded-full bg-table-gold text-center text-table-ink shadow-[0_6px_14px_rgba(0,0,0,0.3)]">
              <span className="leading-none">
                <span className="tabular block font-display text-3xl font-extrabold tracking-[-0.03em]">{num(review.score, 1)}</span>
                <span className="mt-1 block text-[10px]">{t.game.editorScore}</span>
              </span>
            </div>
          )}
        </header>
      </div>
    </section>
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <dl className="mt-8 grid grid-cols-[repeat(auto-fit,minmax(110px,1fr))] overflow-hidden rounded-[18px] border border-line bg-card">
        {([
          [t.game.players, game.maxPlayers ? `${v.minPlayers}–${game.maxPlayers}` : `${v.minPlayers}+`],
          [t.game.time, `${v.playTime}′`],
          [t.game.weight, `${num(v.complexity, 1)}/5`],
          [t.game.age, `${v.minAge}+`],
          [t.catalog.col.year, `${game.year}`],
        ] as const).map(([label, value]) => (
          <div key={label} className="p-4 shadow-[0_0_0_0.5px_var(--color-line)]">
            <dt className="text-xs text-muted">{label}</dt>
            <dd className="tabular mt-1.5 font-mono text-[19px] font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-12">
          {review && <ReviewTeaser t={t} lang={lang} post={review} />}

          {videos.length > 0 && (
            <section>
              <SectionHeading title={t.game.videos} />
              <div className="grid gap-6 sm:grid-cols-2">
                {videos.map((p) => {
                  const { text } = postText(p, lang);
                  return (
                    <div key={p.id} className="space-y-2">
                      <VideoPlayer video={postVideo(p)!} thumb={postThumb(p)} portrait={isPortrait(p)} title={text.title} playLabel={fmt(t.posts.play, { title: text.title })} />
                      <Link href={postHref(lang, p)} className="font-medium hover:underline">{text.title}</Link>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {related.length > 0 && (
            <section>
              <SectionHeading title={t.game.related} />
              <div className="grid gap-6 sm:grid-cols-2">{related.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} />)}</div>
            </section>
          )}

          {!posts.length && <p className="rounded-2xl border border-dashed border-line p-6 text-sm text-muted">{t.game.noContent}</p>}

          {about && (
            <section>
              <SectionHeading title={t.game.about} />
              <p lang="en" className="whitespace-pre-line leading-relaxed">{about.text}</p>
              <p className="mt-2 text-xs text-muted">
                {about.source ? (
                  <>{t.game.aboutWiki} <a href={about.source} target="_blank" rel="noreferrer" className="underline">Wikipedia</a> · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY-SA 4.0</a></>
                ) : t.game.aboutNote}
              </p>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {catalog.live && (
            <GameUserPanel gameId={game.id} labels={{
              title: t.me.yourRating, hint: t.me.rateHint, clear: t.me.clear, played: t.me.played, own: t.me.own,
              wishlist: t.me.wishlist, signInToRate: t.me.signInToRate, banned: t.me.banned, failed: t.me.failed, rateN: t.me.rateN,
              loginHref: href(lang, "/login"),
            }} />
          )}
          <section className="flex flex-wrap gap-x-8 gap-y-5 rounded-[18px] bg-sunken p-[22px]">
            <div>
              <p className="text-[13px] text-muted">{t.me.community}</p>
              <p className={`tabular mt-1.5 font-display text-[44px] font-extrabold leading-none tracking-[-0.04em] ${game.community ? "text-meeple" : "text-muted"}`}>{game.community ? num(game.community.rating, 1) : "–"}</p>
              <p className="mt-1.5 font-mono text-xs text-muted">{game.community ? fmt(t.me.communityVotes, { n: game.community.votes }) : t.me.noCommunity}</p>
            </div>
            <div>
              <p className="text-[13px] text-muted">{t.game.rating}</p>
              <p className="tabular mt-1.5 font-display text-[44px] font-extrabold leading-none tracking-[-0.04em]">{num(v.rating, 1) ?? "–"}</p>
              <p className="mt-1.5 font-mono text-xs text-muted">{game.votes ? fmt(t.game.votes, { n: game.votes.toLocaleString(t.intl) }) : "BoardGameGeek"}</p>
            </div>
          </section>
          {(game.bestPlayers.length > 0 || game.recPlayers.length > 0 || game.mechanics.length > 0 || game.categories.length > 0) && (
            <section className="rounded-2xl border border-line bg-card p-5">
              <h2 className="font-display text-lg font-semibold">{t.game.stats}</h2>
              {(game.bestPlayers.length > 0 || game.recPlayers.length > 0) && (
                <dl className="mt-3 divide-y divide-line text-sm">
                  {game.bestPlayers.length > 0 && <Row label={t.game.best} value={game.bestPlayers.join(", ")} />}
                  {game.recPlayers.length > 0 && <Row label={t.game.recommended} value={game.recPlayers.join(", ")} />}
                </dl>
              )}
              <Tags title={t.game.mechanics} items={game.mechanics} />
              <Tags title={t.game.categories} items={game.categories} />
            </section>
          )}
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">{t.game.similar}</h2>
            <div className="space-y-2">
              {similar.map((g) => <GameCard key={g.id} game={g} genre={genres.get(g.genreId)} lang={lang} t={t} />)}
            </div>
          </section>
        </aside>
      </div>
    </div>
    </>
  );
}

function ReviewTeaser({ t, lang, post }: { t: Dict; lang: "id" | "en"; post: Parameters<typeof postText>[0] }) {
  const { text, lang: textLang } = postText(post, lang);
  return (
    <section className="rounded-2xl border border-felt/40 bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wide text-felt">{t.game.ourReview}</p>
      <h2 lang={textLang} className="mt-1 font-display text-2xl font-semibold">{text.title}</h2>
      {text.excerpt && <p lang={textLang} className="mt-2 text-muted">{text.excerpt}</p>}
      <Link href={postHref(lang, post)} className="mt-4 inline-block text-sm font-medium text-felt underline">{t.game.readReview} →</Link>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium tabular">{value}</dd>
    </div>
  );
}

function Tags({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-4">
      <h3 className="text-xs font-medium text-muted">{title}</h3>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((m) => <li key={m} className="rounded-md bg-sunken px-2 py-0.5 text-xs">{m}</li>)}
      </ul>
    </div>
  );
}
