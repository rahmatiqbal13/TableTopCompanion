import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { formatDate, genreName } from "@/lib/format";
import { gameHref, postHref, postText } from "@/lib/i18n-paths";
import { youTubeThumb } from "@/lib/youtube";
import type { Game, Genre, Post } from "@/lib/types";
import { Cover } from "./cover";

/** Cover for a post: explicit cover, else the video thumbnail, else a generated tile. */
function PostCover({ post, title, intl }: { post: Post; title: string; intl: string }) {
  const src = post.coverUrl ?? (post.youtubeId ? youTubeThumb(post.youtubeId) : null);
  return (
    <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-sunken">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- author covers from any host
        <img src={src} alt="" loading="lazy" className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      ) : (
        <div className="grid size-full place-items-center bg-felt-soft p-6 text-center font-display text-xl font-semibold text-felt">{title}</div>
      )}
      {post.youtubeId && (
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
