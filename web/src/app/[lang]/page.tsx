import Link from "next/link";
import { notFound } from "next/navigation";
import { Cover } from "@/components/cover";
import { TonightTable } from "@/components/tonight-table";
import { getDict, hasLocale, type Dict, type Locale } from "@/i18n";
import { getCatalog, getPublishedPosts } from "@/lib/data";
import { criterionName, formatDate, formatValue } from "@/lib/format";
import { href, postHref, postText } from "@/lib/i18n-paths";
import { youTubeThumb } from "@/lib/youtube";
import type { Catalog, Game, Post, PostType } from "@/lib/types";

const eyebrow = "font-mono text-xs uppercase tracking-[0.12em] text-felt";
const SCORE_SHEET_KEYS = ["rating", "complexity", "playTime"];

export default async function Home({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const [full, posts] = await Promise.all([getCatalog(), getPublishedPosts()]);
  // Descriptions are not needed for ranking; keep the client payload small.
  const catalog: Catalog = { ...full, games: full.games.map((g) => ({ ...g, description: null })) };
  const byType = (type: PostType, n: number) => posts.filter((p) => p.type === type).slice(0, n);
  const [feature, ...moreReviews] = byType("reviews", 3);
  const videos = byType("videos", 3), news = byType("news", 4), guides = byType("guides", 3);
  const games = new Map(catalog.games.map((g) => [g.id, g]));
  const gameOf = (p: Post) => games.get(p.gameIds[0]);
  const shortDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(t.intl, { day: "numeric", month: "short" }) : "");

  return (
    <>
      <TonightTable catalog={catalog} t={t} lang={lang} />

      {feature && (
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-24">
          <Heading title={t.nav.reviews} to={href(lang, "/reviews")} seeAll={t.home.seeAll} />
          <div className="grid gap-10 lg:grid-cols-2">
            <FeatureReview post={feature} game={gameOf(feature)} lang={lang} t={t} />
            <div className="grid min-w-0 content-start gap-7">
              <ScoreSheet post={feature} game={gameOf(feature)} catalog={catalog} t={t} />
              {moreReviews.map((p) => <ReviewRow key={p.id} post={p} game={gameOf(p)} lang={lang} t={t} />)}
            </div>
          </div>
        </section>
      )}

      {videos.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-10 pt-[72px]">
          <Heading title={t.nav.videos} to={href(lang, "/videos")} seeAll={t.home.seeAll} />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((p) => <VideoCard key={p.id} post={p} game={gameOf(p)} lang={lang} t={t} />)}
          </div>
        </section>
      )}

      {(news.length > 0 || guides.length > 0) && (
        <section className={`mx-auto grid max-w-6xl gap-14 px-4 pb-10 pt-[72px] ${news.length && guides.length ? "lg:grid-cols-2" : ""}`}>
          {news.length > 0 && (
            <div>
              <Heading title={t.nav.news} to={href(lang, "/news")} seeAll={t.home.seeAll} tight />
              {news.map((p) => {
                const { text, lang: textLang } = postText(p, lang);
                return (
                  <Link key={p.id} href={postHref(lang, p)} className="grid grid-cols-[72px_1fr] gap-4 border-b border-line py-[18px] hover:text-meeple">
                    <span className="pt-[3px] font-mono text-[13px] text-muted">{shortDate(p.publishedAt)}</span>
                    <span lang={textLang} className="text-pretty font-display text-xl font-semibold leading-tight tracking-[-0.015em]">{text.title}</span>
                  </Link>
                );
              })}
            </div>
          )}
          {guides.length > 0 && (
            <div>
              <Heading title={t.nav.guides} to={href(lang, "/guides")} seeAll={t.home.seeAll} tight />
              {guides.map((p, i) => {
                const { text, lang: textLang } = postText(p, lang);
                return (
                  <Link key={p.id} href={postHref(lang, p)} className="grid grid-cols-[64px_1fr] gap-4 border-b border-line py-5 hover:text-felt">
                    <span className="font-display text-[40px] font-extrabold leading-[0.9] tracking-[-0.05em] text-meeple">{`0${i + 1}`}</span>
                    <span lang={textLang}>
                      <span className="block font-display text-xl font-semibold leading-tight tracking-[-0.015em]">{text.title}</span>
                      {text.excerpt && <span className="mt-1.5 block text-[15px] leading-normal text-muted">{text.excerpt}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24 pt-[72px]">
        <div className="grid items-center gap-8 rounded-3xl bg-sunken p-[clamp(28px,5vw,56px)] lg:grid-cols-2">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-felt">{t.home.method.kicker}</p>
            <h2 className="mt-3 text-balance font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.05] tracking-[-0.035em]">{t.home.method.title}</h2>
            <p className="mt-3.5 max-w-[48ch] leading-relaxed text-muted">{t.home.method.body}</p>
            <Link href={href(lang, "/method")} className="mt-[22px] inline-flex min-h-11 items-center gap-2.5 rounded-full bg-ink py-1.5 pl-5 pr-2 text-[15px] font-medium text-paper transition-colors hover:opacity-90">
              {t.home.method.cta}
              <span aria-hidden className="grid size-[30px] place-items-center rounded-full bg-paper/15">→</span>
            </Link>
          </div>
          <div className="rounded-[18px] border border-line bg-card p-7 font-mono">
            <p className="text-[13px] text-muted">{t.home.method.formula}</p>
            <p className="mt-3.5 text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.02em]">V = D⁻ / (D⁺ + D⁻)</p>
            <div className="mt-5 grid gap-2 text-[13px]">
              <div className="flex justify-between gap-4 border-t border-line pt-2.5"><span>D⁺</span><span className="text-right text-muted">{t.home.method.dPlus}</span></div>
              <div className="flex justify-between gap-4 border-t border-line pt-2.5"><span>D⁻</span><span className="text-right text-muted">{t.home.method.dMinus}</span></div>
            </div>
            <p className="mt-5 font-sans text-sm text-felt">{t.home.method.ads}</p>
          </div>
        </div>
      </section>
    </>
  );
}

function Heading({ title, to, seeAll, tight }: { title: string; to: string; seeAll: string; tight?: boolean }) {
  return (
    <div className={`flex flex-wrap items-baseline justify-between gap-4 border-b-2 border-ink pb-3.5 ${tight ? "mb-2" : "mb-8"}`}>
      <h2 className="font-display text-[clamp(32px,4vw,48px)] font-bold tracking-[-0.035em]">{title}</h2>
      <Link href={to} className="text-sm text-muted hover:text-meeple">{seeAll} →</Link>
    </div>
  );
}

/** Best available picture: the post's own cover, its video, then the game it is about. */
const artFor = (post: Post, game?: Game) =>
  post.coverUrl ?? (post.youtubeId ? youTubeThumb(post.youtubeId) : null) ?? game?.imageUrl ?? null;

function FeatureReview({ post, game, lang, t }: { post: Post; game?: Game; lang: Locale; t: Dict }) {
  const { text, lang: textLang } = postText(post, lang);
  const label = game?.name ?? t.posts.types.reviews.singular;
  return (
    <Link href={postHref(lang, post)} className="grid min-w-0 content-start gap-[18px]">
      <div className="aspect-[16/10] overflow-hidden rounded-[18px]">
        <Cover name={game?.name ?? text.title} src={artFor(post, game)} fillText={120} />
      </div>
      <div>
        <p className={eyebrow}>{label}{post.publishedAt && <span className="text-muted"> · {formatDate(t, post.publishedAt)}</span>}</p>
        <h3 lang={textLang} className="mt-2.5 text-balance font-display text-[clamp(28px,3.2vw,40px)] font-bold leading-[1.05] tracking-[-0.03em]">{text.title}</h3>
        {text.excerpt && <p lang={textLang} className="mt-3 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-muted">{text.excerpt}</p>}
      </div>
    </Link>
  );
}

/** The editor's score next to the game's own numbers. Renders nothing when there are neither. */
function ScoreSheet({ post, game, catalog, t }: { post: Post; game?: Game; catalog: Catalog; t: Dict }) {
  const rows = game
    ? SCORE_SHEET_KEYS.flatMap((key) => {
        const c = catalog.criteria.find((x) => x.key === key), v = game.values[key];
        return c && Number.isFinite(v) ? [{ key, label: criterionName(t, c), value: formatValue(t, c, v) }] : [];
      })
    : [];
  if (post.score === null && !rows.length) return null;
  return (
    <div className="rounded-[18px] border border-line bg-card bg-[repeating-linear-gradient(0deg,transparent_0_35px,var(--sunken)_35px_36px)] p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{t.home.scoresheet}</p>
        {post.score !== null && (
          <div className="text-right">
            <div className="tabular font-display text-[72px] font-extrabold leading-[0.85] tracking-[-0.05em] text-meeple">{post.score.toLocaleString(t.intl, { maximumFractionDigits: 1 })}</div>
            <div className="mt-1.5 font-mono text-xs text-muted">/ 10 · {t.home.editor}</div>
          </div>
        )}
      </div>
      {rows.length > 0 && (
        <ul className="mt-[22px]">
          {rows.map((r) => (
            <li key={r.key} className="flex h-9 items-baseline gap-2.5 text-[15px]">
              <span>{r.label}</span>
              <span aria-hidden className="flex-1 -translate-y-1 border-b border-dotted border-muted/50" />
              <span className="font-mono font-semibold">{r.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewRow({ post, game, lang, t }: { post: Post; game?: Game; lang: Locale; t: Dict }) {
  const { text, lang: textLang } = postText(post, lang);
  return (
    <Link href={postHref(lang, post)} className="grid grid-cols-[88px_1fr_auto] items-center gap-4 border-t border-line pt-5 hover:text-meeple">
      <div className="size-[88px] overflow-hidden rounded-[14px]">
        <Cover name={game?.name ?? text.title} src={artFor(post, game)} fillText={30} />
      </div>
      <div className="min-w-0">
        {game && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-felt">{game.name}</p>}
        <h3 lang={textLang} className="mt-1 font-display text-xl font-semibold leading-tight tracking-[-0.02em]">{text.title}</h3>
      </div>
      {post.score !== null && (
        <span className="tabular font-display text-[32px] font-extrabold tracking-[-0.04em] text-meeple">{post.score.toLocaleString(t.intl, { maximumFractionDigits: 1 })}</span>
      )}
    </Link>
  );
}

function VideoCard({ post, game, lang, t }: { post: Post; game?: Game; lang: Locale; t: Dict }) {
  const { text, lang: textLang } = postText(post, lang);
  return (
    <Link href={postHref(lang, post)} className="grid gap-3.5">
      <div className="relative grid aspect-video place-items-center overflow-hidden rounded-2xl">
        <Cover name={game?.name ?? text.title} src={artFor(post, game)} fillText={54} faint />
        <span aria-hidden className="absolute grid size-14 place-items-center rounded-full bg-[#f4efe4] text-[#1f1b16] shadow-[0_8px_20px_rgba(0,0,0,0.3)]">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
        </span>
      </div>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-felt">{game?.name ?? t.posts.types.videos.singular}</p>
        <h3 lang={textLang} className="mt-1.5 text-balance font-display text-[21px] font-semibold leading-tight tracking-[-0.02em]">{text.title}</h3>
      </div>
    </Link>
  );
}
