import Link from "next/link";
import { fmt, type Dict, type Locale } from "@/i18n";
import { formatDate, genreName } from "@/lib/format";
import { gameHref, postHref, postText } from "@/lib/i18n-paths";
import { formatDuration, postThumb, postVideo } from "@/lib/video";
import type { Game, Genre, Post, PostText } from "@/lib/types";
import { Cover } from "./cover";

/** Cover for a post: explicit cover, else the video thumbnail, else a generated tile. */
function PostCover({ post, title, intl }: { post: Post; title: string; intl: string }) {
  const src = postThumb(post);
  const video = postVideo(post);
  return (
    <div className="relative grid aspect-[16/9] place-items-center overflow-hidden rounded-2xl bg-sunken">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- author covers from any host
        <img src={src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      ) : (
        <div className="absolute inset-0"><Cover name={title} src={null} fillText={54} faint={Boolean(video)} /></div>
      )}
      {video && (
        <span aria-hidden className="relative grid size-14 place-items-center rounded-full bg-paper text-ink shadow-[0_8px_20px_rgba(0,0,0,0.3)] transition-transform duration-200 group-hover:scale-105">
          <svg viewBox="0 0 24 24" width="20" height="20"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
        </span>
      )}
      {video && post.durationSec !== null && (
        <span className="tabular absolute bottom-2.5 right-2.5 rounded-md bg-black/65 px-2 py-0.5 font-mono text-xs text-white">{formatDuration(post.durationSec)}</span>
      )}
      {post.score !== null && (
        <span className="absolute right-2 top-2 rounded-lg bg-ink px-2 py-1 font-display text-sm font-semibold text-paper tabular">
          {post.score.toLocaleString(intl, { maximumFractionDigits: 1 })}
        </span>
      )}
    </div>
  );
}

/** The "Learn it in 60 seconds" rail of vertical videos. */
export function ShortsRail({ posts, lang, t }: { posts: Post[]; lang: Locale; t: Dict }) {
  return (
    <div>
      <p className="mb-3.5 font-mono text-xs uppercase tracking-[0.14em] text-meeple">{t.posts.shortsLabel}</p>
      <div className="-mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-2 [scrollbar-width:none]">
        {posts.map((p) => {
          const { text, lang: textLang } = postText(p, lang);
          return (
            <Link key={p.id} href={postHref(lang, p)}
              className="relative aspect-[9/16] w-[168px] shrink-0 snap-start overflow-hidden rounded-2xl bg-sunken transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 active:scale-[0.98]">
              <div className="absolute inset-0"><Cover name={text.title} src={postThumb(p)} fillText={54} faint /></div>
              <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-black/70" />
              {p.durationSec !== null && <span className="tabular absolute left-3 top-3 rounded-full bg-black/50 px-2 py-0.5 font-mono text-[11px] text-white">{formatDuration(p.durationSec)}</span>}
              <span lang={textLang} className="absolute inset-x-3.5 bottom-3.5 font-display text-lg font-bold leading-[1.15] tracking-[-0.015em] text-white">{text.title}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

/** Who a review is for and how the reviewer got the game. Renders nothing when none are filled in. */
export function ReviewVerdict({ post, text, textLang, t }: { post: Post; text: PostText; textLang: Locale; t: Dict }) {
  const r = t.posts.review;
  if (!text.forWho && !text.skip && !post.reviewSource) return null;
  const pill = "shrink-0 rounded-full px-2.5 py-[3px] font-mono text-[11px] font-semibold";
  return (
    <div className="grid max-w-[52ch] gap-2.5">
      {text.forWho && <p lang={textLang} className="flex items-baseline gap-2.5 text-[15px] leading-snug"><span className={`${pill} bg-felt-soft text-felt`}>▲ {r.forLabel}</span><span>{text.forWho}</span></p>}
      {text.skip && <p lang={textLang} className="flex items-baseline gap-2.5 text-[15px] leading-snug"><span className={`${pill} bg-meeple-soft text-meeple`}>▼ {r.skipLabel}</span><span>{text.skip}</span></p>}
      {post.reviewSource && <p className="mt-1 font-mono text-xs text-muted">{r.srcLabel}: {r.sources[post.reviewSource]}</p>}
    </div>
  );
}

export function PostCard({ post, lang, t, size = "md", game }: { post: Post; lang: Locale; t: Dict; size?: "md" | "lg"; game?: string }) {
  const { text, lang: textLang } = postText(post, lang);
  return (
    <article className="group">
      <Link href={postHref(lang, post)} className="grid gap-3.5 text-ink">
        <PostCover post={post} title={game ?? text.title} intl={t.intl} />
        <div>
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.12em] text-felt">
            {game ?? t.posts.types[post.type].singular}
            {post.publishedAt && <span className="text-muted"> · {formatDate(t, post.publishedAt)}</span>}
          </p>
          <h3 lang={textLang} className={`mt-1.5 text-balance font-display font-semibold leading-[1.15] tracking-[-0.02em] group-hover:underline ${size === "lg" ? "text-2xl" : "text-[21px]"}`}>
            {text.title}
          </h3>
          {text.excerpt && <p lang={textLang} className="mt-1 line-clamp-2 text-sm text-muted">{text.excerpt}</p>}
        </div>
      </Link>
    </article>
  );
}

export function GameCard({ game, genre, lang, t }: { game: Game; genre?: Genre; lang: Locale; t: Dict }) {
  return (
    <Link href={gameHref(lang, game)} className="flex items-center gap-3 rounded-xl border border-line bg-card p-3 hover:bg-sunken">
      <Cover name={game.name} src={game.imageUrl} size={48} />
      <div className="min-w-0">
        <p className="truncate font-medium">{game.name}</p>
        <p className="text-xs text-muted">
          {genreName(t, genre)} · {game.values.rating?.toLocaleString(t.intl, { maximumFractionDigits: 1 })}★
        </p>
      </div>
    </Link>
  );
}

/** Review tile: cover with the editor's score, then who it is for and when to skip it. */
export function ReviewCard({ post, lang, t, game }: { post: Post; lang: Locale; t: Dict; game?: string }) {
  const { text, lang: textLang } = postText(post, lang);
  const src = postThumb(post);
  return (
    <Link href={postHref(lang, post)}
      className="group grid grid-rows-[auto_1fr] rounded-[20px] border border-line bg-card p-2.5 text-ink transition-transform duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1">
      <div className="relative aspect-[16/9] rounded-[14px]">
        <div className="absolute inset-0 overflow-hidden rounded-[14px]">
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- author covers from any host
            <img src={src} alt="" loading="lazy" className="size-full object-cover" />
          ) : <Cover name={game ?? text.title} src={null} fillText={72} />}
        </div>
        {post.score !== null && (
          <span className="tabular absolute -bottom-[22px] right-3 grid size-[60px] place-items-center rounded-full bg-table-gold font-display text-2xl font-extrabold tracking-[-0.03em] text-table-ink shadow-[0_6px_14px_rgba(0,0,0,0.25)]">
            {post.score.toLocaleString(t.intl, { maximumFractionDigits: 1 })}
          </span>
        )}
      </div>
      <div className="grid content-start gap-2.5 px-2.5 pb-2.5 pt-4">
        {(game || post.publishedAt) && (
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-felt">
            {game}{game && post.publishedAt && " · "}{post.publishedAt && <span className="text-muted">{formatDate(t, post.publishedAt)}</span>}
          </p>
        )}
        <h3 lang={textLang} className="text-balance pr-14 font-display text-2xl font-bold leading-[1.1] tracking-[-0.025em] group-hover:underline">{text.title}</h3>
        {text.excerpt && <p lang={textLang} className="text-pretty text-[15px] leading-relaxed text-muted">{text.excerpt}</p>}
        {(text.forWho || text.skip || post.reviewSource) && (
          <div className="mt-1 border-t border-dashed border-line pt-3"><ReviewVerdict post={post} text={text} textLang={textLang} t={t} /></div>
        )}
      </div>
    </Link>
  );
}

/** News: the latest story large on the left, the rest as a dated list. */
export function NewsList({ posts, lang, t }: { posts: Post[]; lang: Locale; t: Dict }) {
  const [lead, ...rest] = posts;
  const date = (p: Post) => p.publishedAt ? new Date(p.publishedAt).toLocaleDateString(t.intl, { day: "numeric", month: "short" }) : "";
  const { text, lang: textLang } = postText(lead, lang);
  return (
    <div className="grid items-start gap-12 lg:grid-cols-2">
      <Link href={postHref(lang, lead)} className="group grid gap-[18px] text-ink">
        {postThumb(lead) ? <PostCover post={lead} title={text.title} intl={t.intl} /> : (
          <div className="table-surface relative grid aspect-[4/3] place-items-end justify-items-start overflow-hidden rounded-[20px] p-6">
            <span className="rounded-full bg-table-gold px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.06em] text-table-ink">{t.posts.types.news.singular}</span>
          </div>
        )}
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.12em] text-muted">{t.heroes.latest}{lead.publishedAt && ` · ${formatDate(t, lead.publishedAt)}`}</p>
          <h2 lang={textLang} className="mt-2.5 text-balance font-display text-[clamp(28px,3.4vw,42px)] font-bold leading-[1.05] tracking-[-0.03em] group-hover:underline">{text.title}</h2>
          {text.excerpt && <p lang={textLang} className="mt-3 max-w-[52ch] text-pretty text-[17px] leading-relaxed text-muted">{text.excerpt}</p>}
        </div>
      </Link>
      {rest.length > 0 && (
        <div className="border-t-2 border-ink">
          {rest.map((p) => {
            const x = postText(p, lang);
            return (
              <Link key={p.id} href={postHref(lang, p)} className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 border-b border-line py-5 text-ink hover:text-meeple">
                <span className="pt-[3px] font-mono text-[13px] text-muted">{date(p)}</span>
                <span lang={x.lang}>
                  <span className="block text-pretty font-display text-xl font-semibold leading-tight tracking-[-0.015em]">{x.text.title}</span>
                  {x.text.excerpt && <span className="mt-1.5 line-clamp-2 block text-[15px] leading-normal text-muted">{x.text.excerpt}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Numbered guide row with an estimated reading time. */
export function GuideRow({ post, n, lang, t }: { post: Post; n: number; lang: Locale; t: Dict }) {
  const { text, lang: textLang } = postText(post, lang);
  const mins = text.readMinutes ?? Math.max(1, Math.round((text.body?.split(/\s+/).filter(Boolean).length ?? 0) / 200));
  return (
    <Link href={postHref(lang, post)} className="grid grid-cols-[64px_minmax(0,1fr)_auto] gap-4 border-b border-line py-5 text-ink hover:text-felt">
      <span className="font-display text-[40px] font-extrabold leading-[0.9] tracking-[-0.05em] text-meeple">{String(n).padStart(2, "0")}</span>
      <span lang={textLang}>
        <span className="block font-display text-xl font-semibold leading-tight tracking-[-0.015em]">{text.title}</span>
        {text.excerpt && <span className="mt-1.5 block text-[15px] leading-normal text-muted">{text.excerpt}</span>}
      </span>
      <span className="whitespace-nowrap pt-1 font-mono text-xs text-muted">{fmt(t.heroes.readMin, { n: mins })}</span>
    </Link>
  );
}
