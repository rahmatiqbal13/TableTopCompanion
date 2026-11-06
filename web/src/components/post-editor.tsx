"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { savePost, uploadImage, type FormState } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import { parseYouTubeId } from "@/lib/youtube";
import type { Game, Post, PostType } from "@/lib/types";
import { Markdown } from "./markdown";

const input = "w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm";
const LANGS = [{ code: "id", label: "Bahasa Indonesia" }, { code: "en", label: "English" }] as const;
const TYPES: { value: PostType; label: string }[] = [
  { value: "news", label: "News" }, { value: "reviews", label: "Review" },
  { value: "videos", label: "Video" }, { value: "guides", label: "Guide" },
];

export function PostEditor({ post, games, canUpload }: { post: Post | null; games: Pick<Game, "id" | "name" | "year">[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  const [type, setType] = useState<PostType>(post?.type ?? "reviews");
  const [tab, setTab] = useState<"id" | "en">("id");
  const [preview, setPreview] = useState(false);
  const [text, setText] = useState({
    id: post?.text.id ?? { title: "", excerpt: "", body: "" },
    en: post?.text.en ?? { title: "", excerpt: "", body: "" },
  });
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [youtube, setYoutube] = useState(post?.youtubeId ? `https://youtu.be/${post.youtubeId}` : "");
  const [cover, setCover] = useState(post?.coverUrl ?? "");
  const [gameIds, setGameIds] = useState<number[]>(post?.gameIds ?? []);
  const ytId = parseYouTubeId(youtube);
  const autoSlug = slugify(text.id.title || text.en.title);

  const setField = (field: "title" | "excerpt" | "body", value: string) =>
    setText((s) => ({ ...s, [tab]: { ...s[tab], [field]: value } }));

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={post?.id ?? ""} />
      {LANGS.flatMap(({ code }) => (["title", "excerpt", "body"] as const).map((f) => (
        <input key={`${code}-${f}`} type="hidden" name={`${f}_${code}`} value={text[code][f]} />
      )))}

      <div className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-4">
        <label className="text-sm font-medium">Type
          <select name="type" value={type} onChange={(e) => setType(e.target.value as PostType)} className={`${input} mt-1`}>
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">Status
          <select name="status" defaultValue={post?.status ?? "draft"} className={`${input} mt-1`}>
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="text-sm font-medium">Publish date
          <input name="publishedAt" type="date" defaultValue={post?.publishedAt?.slice(0, 10) ?? ""} className={`${input} mt-1`} />
        </label>
        <label className="text-sm font-medium">Slug <span className="font-normal text-muted">(URL)</span>
          <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug || "auto from title"} className={`${input} mt-1`} />
        </label>
      </div>

      <div className="rounded-2xl border border-line bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
          {LANGS.map((l) => (
            <button key={l.code} type="button" onClick={() => setTab(l.code)} aria-pressed={tab === l.code}
              className={`rounded-md px-3 py-1.5 text-sm ${tab === l.code ? "bg-felt text-on-felt" : "text-muted hover:text-ink"}`}>
              {l.label}{text[l.code].title ? " ✓" : ""}
            </button>
          ))}
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Preview
          </label>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-xs text-muted">Leave a language empty to skip it; readers then see the other language with a note.</p>
          <label className="block text-sm font-medium">Title
            <input value={text[tab].title} onChange={(e) => setField("title", e.target.value)} maxLength={200} className={`${input} mt-1 text-base`} />
          </label>
          <label className="block text-sm font-medium">Excerpt <span className="font-normal text-muted">(shown on cards and in search results)</span>
            <textarea value={text[tab].excerpt} onChange={(e) => setField("excerpt", e.target.value)} rows={2} maxLength={400} className={`${input} mt-1`} />
          </label>
          {preview ? (
            <div className="rounded-xl border border-line p-5"><Markdown source={text[tab].body} playLabel="Play" /></div>
          ) : (
            <label className="block text-sm font-medium">Body <span className="font-normal text-muted">(Markdown: ## heading, **bold**, [link](url), a YouTube link on its own line becomes a player)</span>
              <textarea value={text[tab].body} onChange={(e) => setField("body", e.target.value)} rows={18} className={`${input} mt-1 font-mono`} />
            </label>
          )}
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-line bg-card p-5 sm:grid-cols-2">
        <label className="text-sm font-medium">YouTube link {type === "videos" && <span className="text-meeple">(required)</span>}
          <input name="youtube" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://youtu.be/…" className={`${input} mt-1`} />
          {youtube && <span className={`mt-1 block text-xs ${ytId ? "text-felt" : "text-meeple"}`}>{ytId ? `✓ video ${ytId}` : "Not a YouTube link"}</span>}
        </label>
        {type === "reviews" && (
          <label className="text-sm font-medium">Editor&apos;s score <span className="font-normal text-muted">(0–10)</span>
            <input name="score" type="number" min={0} max={10} step={0.5} defaultValue={post?.score ?? ""} className={`${input} mt-1`} />
          </label>
        )}
        <div className="sm:col-span-2">
          <label className="text-sm font-medium">Cover image URL <span className="font-normal text-muted">(optional; videos use the YouTube thumbnail)</span>
            <input name="coverUrl" type="url" value={cover} onChange={(e) => setCover(e.target.value)} className={`${input} mt-1`} />
          </label>
          <ImageUpload enabled={canUpload} onUploaded={(url) => setCover((c) => c || url)} />
        </div>
      </div>

      <GamePicker games={games} value={gameIds} onChange={setGameIds} />
      <input type="hidden" name="gameIds" value={gameIds.join(",")} />

      <div className="flex items-center gap-3">
        <button className="rounded-lg bg-felt px-4 py-2 text-sm font-medium text-on-felt disabled:opacity-60" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
        {state.error && <p role="alert" className="text-sm text-meeple">{state.error}</p>}
      </div>
    </form>
  );
}

function ImageUpload({ enabled, onUploaded }: { enabled: boolean; onUploaded: (url: string) => void }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ url?: string; error?: string }>({});
  if (!enabled) {
    return <p className="mt-2 text-xs text-muted">Connect a Vercel Blob store to upload images here; until then paste an image URL.</p>;
  }
  return (
    <div className="mt-2 space-y-1 text-xs">
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" disabled={pending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.set("file", file);
          start(async () => {
            const r = await uploadImage(fd);
            setResult(r);
            if (r.url) onUploaded(r.url);
          });
        }} />
      {pending && <p className="text-muted">Uploading…</p>}
      {result.error && <p className="text-meeple">{result.error}</p>}
      {result.url && (
        <p className="text-muted">Uploaded. For the body, paste: <code className="select-all rounded bg-sunken px-1">![]({result.url})</code></p>
      )}
    </div>
  );
}

function GamePicker({ games, value, onChange }: { games: Pick<Game, "id" | "name" | "year">[]; value: number[]; onChange: (ids: number[]) => void }) {
  const [q, setQ] = useState("");
  const byId = useMemo(() => new Map(games.map((g) => [g.id, g])), [games]);
  const matches = q.trim().length < 2 ? [] : games
    .filter((g) => !value.includes(g.id) && g.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-sm font-medium">Games in this post <span className="font-normal text-muted">(the post appears on each game&apos;s page)</span></p>
      {value.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id} className="flex items-center gap-1 rounded-full bg-felt-soft py-0.5 pl-3 pr-1 text-sm">
              {byId.get(id)?.name ?? `#${id}`}
              <button type="button" aria-label="Remove" onClick={() => onChange(value.filter((x) => x !== id))} className="grid size-5 place-items-center rounded-full hover:bg-card">×</button>
            </li>
          ))}
        </ul>
      )}
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search games to link" aria-label="Search games to link" className={`${input} mt-2`} />
      {matches.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-lg border border-line text-sm">
          {matches.map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => { onChange([...value, g.id]); setQ(""); }} className="flex w-full justify-between px-3 py-1.5 text-left hover:bg-sunken">
                <span>{g.name}</span><span className="text-muted">{g.year}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
