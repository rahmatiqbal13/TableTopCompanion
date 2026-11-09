import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { formatDate, genreName } from "@/lib/format";
import { gameHref, postHref, postText } from "@/lib/i18n-paths";
import { formatDuration, postThumb, postVideo } from "@/lib/video";
import type { Game, Genre, Post, PostText } from "@/lib/types";
import { Cover } from "./cover";

/** Cover for a post: explicit cover, else the video thumbnail, else a generated tile. */
function PostCover({ post, title, intl }: { post: Post; title: string; intl: string }) {
  const src = postThumb(post);
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-sunken">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- author covers from any host
        <img src={src} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      ) : (
        <div className="grid size-full place-items-center bg-felt-soft p-6 text-center font-display text-xl font-semibold text-felt">{title}</div>
      )}
      {postVideo(post) && (
        <span className="absolute bottom-2 left-2 grid size-9 place-items-center rounded-full bg-black/70 text-white" aria-hidden>
          <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
        </span>
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

export function PostCard({ post, lang, t, size = "md" }: { post: Post; lang: Locale; t: Dict; size?: "md" | "lg" }) {
  const { text, lang: textLang } = postText(post, lang);
  return (
    <article className="group">
      <Link href={postHref(lang, post)} className="block space-y-3">
        <PostCover post={post} title={text.title} intl={t.intl} />
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-felt">
            {t.posts.types[post.type].singular}
            {post.publishedAt && <span className="font-normal normal-case tracking-normal text-muted"> · {formatDate(t, post.publishedAt)}</span>}
          </p>
          <h3 lang={textLang} className={`mt-1 font-display font-semibold leading-snug group-hover:underline ${size === "lg" ? "text-2xl" : "text-lg"}`}>
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
