import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PageHero, PageSkeleton } from "@/components/ui";
import { GameCard, GuideRow, NewsList, PostCard, ReviewCard, ReviewVerdict, ShortsRail } from "@/components/cards";
import { Markdown } from "@/components/markdown";
import { VideoPlayer } from "@/components/video-player";
import { fmt, getDict, hasLocale, locales } from "@/i18n";
import { getCatalog, getPublishedPost, getPublishedPosts } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { href, postHref, postText } from "@/lib/i18n-paths";
import { isPortrait, postThumb, postVideo } from "@/lib/video";
import { SUBSCORE_KEYS, type PostType } from "@/lib/types";

type ListProps = { params: Promise<{ lang: string }> };
type DetailProps = { params: Promise<{ lang: string; slug: string }> };

/** Builds the list page for one content section (news, reviews, videos, guides). */
export function listing(type: PostType) {
  async function generateMetadata({ params }: ListProps): Promise<Metadata> {
    const { lang } = await params;
    if (!hasLocale(lang)) return {};
    const s = getDict(lang).posts.types[type];
    return { title: s.title, description: s.intro, alternates: { languages: Object.fromEntries(locales.map((l) => [l, `/${l}/${type}`])) } };
  }

  async function Page({ params }: ListProps) {
    const { lang } = await params;
    if (!hasLocale(lang)) notFound();
    const t = getDict(lang);
    const [posts0, catalog] = await Promise.all([getPublishedPosts(), getCatalog()]);
    const all = posts0.filter((p) => p.type === type);
    const names = new Map(catalog.games.map((g) => [g.id, g.name]));
    const gameOf = (p: (typeof all)[number]) => names.get(p.gameIds[0]);
    const shorts = type === "videos" ? all.filter((p) => p.videoFormat === "short") : [];
    const posts = all.filter((p) => !shorts.includes(p));
    const h = t.heroes[type];
    return (
      <>
        <PageHero kicker={h.kicker} title={h.title} sub={h.sub} />
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
          {shorts.length > 0 && <div className="mb-12"><ShortsRail posts={shorts} lang={lang} t={t} /></div>}
          {!posts.length && !shorts.length ? (
            <p className="rounded-2xl border border-dashed border-line p-10 text-center text-muted">{t.posts.empty}</p>
          ) : type === "reviews" ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <ReviewCard key={p.id} post={p} lang={lang} t={t} game={gameOf(p)} />)}
            </div>
          ) : type === "news" ? (
            <NewsList posts={posts} lang={lang} t={t} />
          ) : type === "guides" ? (
            <div className="grid border-t-2 border-ink md:grid-cols-2 md:gap-x-12">
              {posts.map((p, i) => <GuideRow key={p.id} post={p} n={i + 1} lang={lang} t={t} />)}
            </div>
          ) : (
            <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} game={gameOf(p)} />)}
            </div>
          )}
        </div>
      </>
    );
  }
  return { Page, generateMetadata };
}

/** Builds the article page for one content section. */
export function detail(type: PostType) {
  async function generateStaticParams() {
    const slugs = (await getPublishedPosts()).filter((p) => p.type === type).map((p) => ({ slug: p.slug }));
    // Cache Components needs at least one param to validate the route; the placeholder 404s.
    return slugs.length ? slugs : [{ slug: "__none__" }];
  }

  async function generateMetadata({ params }: DetailProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const post = hasLocale(lang) ? await getPublishedPost(slug) : null;
    if (!post || post.type !== type || !hasLocale(lang)) return {};
    const { text } = postText(post, lang);
    const image = postThumb(post) ?? undefined;
    return {
      title: text.title,
      description: text.excerpt,
      alternates: {
        canonical: postHref(lang, post),
        languages: Object.fromEntries(locales.filter((l) => post.text[l]?.title).map((l) => [l, `/${l}/${type}/${slug}`])),
      },
      openGraph: { type: "article", title: text.title, description: text.excerpt, publishedTime: post.publishedAt ?? undefined, images: image ? [image] : undefined },
    };
  }

  // The slug is URL data: stream the article behind a placeholder so client
  // navigation to new (not prerendered) articles stays instant.
  function Page({ params }: DetailProps) {
    return <Suspense fallback={<PageSkeleton />}><Article params={params} /></Suspense>;
  }

  async function Article({ params }: DetailProps) {
    const { lang, slug } = await params;
    if (!hasLocale(lang)) notFound();
    const post = await getPublishedPost(slug);
    if (!post || post.type !== type) notFound();
    const t = getDict(lang);
    const { text, lang: textLang, fallback } = postText(post, lang);
    const [catalog, all] = await Promise.all([getCatalog(), getPublishedPosts()]);
    const games = post.gameIds.map((id) => catalog.games.find((g) => g.id === id)).filter((g) => g !== undefined);
    const genres = new Map(catalog.genres.map((g) => [g.id, g]));
    const more = all.filter((p) => p.type === type && p.id !== post.id).slice(0, 3);
    const video = postVideo(post);
    const subs = SUBSCORE_KEYS.filter((k) => post.subscores[k] !== undefined);

    return (
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-8">
        <Link href={href(lang, `/${type}`)} className="text-sm text-muted underline">← {t.posts.types[type].title}</Link>
        <article className="mx-auto mt-6 max-w-3xl">
          <header>
            <p className="text-xs font-medium uppercase tracking-wide text-felt">
              {t.posts.types[type].singular}
              {post.publishedAt && <span className="font-normal normal-case tracking-normal text-muted"> · {fmt(t.posts.published, { date: formatDate(t, post.publishedAt) })}</span>}
            </p>
            <h1 lang={textLang} className="mt-2 font-display text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">{text.title}</h1>
            {text.excerpt && <p lang={textLang} className="mt-4 text-lg text-muted">{text.excerpt}</p>}
          </header>
          {fallback && <p className="mt-6 rounded-xl bg-sunken p-3 text-sm text-muted">{t.posts.onlyIn}</p>}
          <div className="mt-8">
            {video ? (
              <VideoPlayer video={video} thumb={postThumb(post)} portrait={isPortrait(post)} title={text.title} playLabel={fmt(t.posts.play, { title: text.title })} />
            ) : post.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- author covers from any host
              <img src={post.coverUrl} alt="" className="w-full rounded-2xl" />
            ) : null}
          </div>
          {post.score !== null && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl border border-felt/40 bg-card p-5">
              <span className="font-display text-5xl font-semibold tabular text-felt">
                {post.score.toLocaleString(t.intl, { maximumFractionDigits: 1 })}
              </span>
              <span className="text-sm text-muted">{t.game.editorScore}<br />/ 10</span>
            </div>
          )}
          {subs.length > 0 && (
            <ul className="mt-4 rounded-2xl border border-line bg-card px-5 py-3">
              {subs.map((k) => (
                <li key={k} className="flex h-9 items-baseline gap-2.5 text-[15px]">
                  <span>{t.posts.review.subs[k]}</span>
                  <span aria-hidden className="flex-1 -translate-y-1 border-b border-dotted border-muted/50" />
                  <span className="font-mono font-semibold">{post.subscores[k]}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-6"><ReviewVerdict post={post} text={text} textLang={textLang} t={t} /></div>
          <div lang={textLang} className="mt-8">
            <Markdown source={text.body} playLabel={fmt(t.posts.play, { title: text.title })} />
          </div>
          {games.length > 0 && (
            <section className="mt-12">
              <h2 className="mb-3 font-display text-xl font-semibold">{t.posts.gamesInPost}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {games.map((g) => <GameCard key={g.id} game={g} genre={genres.get(g.genreId)} lang={lang} t={t} />)}
              </div>
            </section>
          )}
        </article>
        {more.length > 0 && (
          <section className="mt-20 border-t border-line pt-10">
            <h2 className="mb-6 font-display text-2xl font-semibold">{fmt(t.posts.more, { type: t.posts.types[type].title })}</h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => <PostCard key={p.id} post={p} lang={lang} t={t} />)}
            </div>
          </section>
        )}
      </div>
    );
  }
  return { Page, generateMetadata, generateStaticParams };
}
