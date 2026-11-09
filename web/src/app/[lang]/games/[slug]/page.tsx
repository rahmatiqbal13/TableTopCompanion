import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { Suspense } from "react";
import { GameCard, PostCard } from "@/components/cards";
import { Cover } from "@/components/cover";
import { GameUserPanel } from "@/components/game-user-panel";
import { PageSkeleton, SectionHeading } from "@/components/ui";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { fmt, getDict, hasLocale, locales, type Dict } from "@/i18n";
import { getCatalog, getPublishedPosts } from "@/lib/data";
import { gameSlug, genreName } from "@/lib/format";
import { gameHref, href, postHref, postText } from "@/lib/i18n-paths";
import { similarityFor } from "@/lib/recommend";
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
  const videos = posts.filter((p) => p.youtubeId);
  const related = posts.filter((p) => p !== review && !p.youtubeId);
  const genres = new Map(catalog.genres.map((g) => [g.id, g]));

  const sim = similarityFor(catalog.games);
  const similar = catalog.games
    .filter((g) => g.id !== game.id)
    .map((g) => ({ g, s: sim.similarity(game, g) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 6)
    .map((x) => x.g);

  const v = game.values;
  const num = (x: number | undefined, d: number) => x?.toLocaleString(t.intl, { minimumFractionDigits: d, maximumFractionDigits: d });
  const bgg = game.linkUrl ?? (game.bggId
    ? `https://boardgamegeek.com/boardgame/${game.bggId}`
    : `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(game.name)}`);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-8">
      <Link href={href(lang, "/games")} className="text-sm text-muted underline">← {t.game.back}</Link>

      <header className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start">
        <Cover name={game.name} src={game.imageUrl} size={160} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            {genreName(t, genres.get(game.genreId))} · {game.year}
            {game.bggRank && ` · ${fmt(t.game.bggRank, { n: game.bggRank })}`}
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{game.name}</h1>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href={`${href(lang, "/recommend")}?fav=${game.id}`} className="rounded-xl bg-felt px-4 py-2.5 text-sm font-medium text-on-felt hover:opacity-90">
              {t.game.findSimilar}
            </Link>
            <a href={bgg} target="_blank" rel="noreferrer" className="rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-medium hover:bg-sunken">
              {t.game.viewBgg} ↗
            </a>
          </div>
        </div>
        {review?.score != null && (
          <div className="rounded-2xl border border-line bg-card px-5 py-4 text-center">
            <p className="font-display text-4xl font-semibold tabular text-felt">{num(review.score, 1)}</p>
            <p className="text-xs text-muted">{t.game.editorScore}</p>
          </div>
        )}
      </header>

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
                      <YouTubeEmbed id={p.youtubeId!} title={text.title} playLabel={fmt(t.posts.play, { title: text.title })} />
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

          {game.description && (
            <section>
              <SectionHeading title={t.game.about} />
              <p lang="en" className="whitespace-pre-line leading-relaxed">{game.description}</p>
              <p className="mt-2 text-xs text-muted">{t.game.aboutNote}</p>
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
          <section className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">{t.game.stats}</h2>
            <dl className="mt-3 divide-y divide-line text-sm">
              <Row label={t.game.players} value={game.maxPlayers ? `${v.minPlayers}–${game.maxPlayers}` : `${v.minPlayers}+`} />
              <Row label={t.game.time} value={`${v.playTime} min`} />
              <Row label={t.game.weight} value={`${num(v.complexity, 2)} / 5`} />
              <Row label={t.game.rating} value={`${num(v.rating, 2)}${game.votes ? ` · ${fmt(t.game.votes, { n: game.votes.toLocaleString(t.intl) })}` : ""}`} />
              <Row label={t.me.community} value={game.community
                ? `${num(game.community.rating, 1)} · ${fmt(t.me.communityVotes, { n: game.community.votes })}`
                : t.me.noCommunity} />
              <Row label={t.game.age} value={`${v.minAge}+`} />
              {game.bestPlayers.length > 0 && <Row label={t.game.best} value={game.bestPlayers.join(", ")} />}
              {game.recPlayers.length > 0 && <Row label={t.game.recommended} value={game.recPlayers.join(", ")} />}
            </dl>
            <Tags title={t.game.mechanics} items={game.mechanics} />
            <Tags title={t.game.categories} items={game.categories} />
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg font-semibold">{t.game.similar}</h2>
            <div className="space-y-2">
              {similar.map((g) => <GameCard key={g.id} game={g} genre={genres.get(g.genreId)} lang={lang} t={t} />)}
            </div>
          </section>
        </aside>
      </div>
    </div>
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
