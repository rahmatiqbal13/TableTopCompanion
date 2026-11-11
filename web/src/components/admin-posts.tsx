"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { deletePost, savePost, type FormState } from "@/app/admin/actions";
import { postHref, postText } from "@/lib/i18n-paths";
import { formatDuration, postVideo, videoLink } from "@/lib/video";
import { REVIEW_SOURCES, SUBSCORE_KEYS, type Post, type PostType, type ReviewSource } from "@/lib/types";
import { DeleteButton } from "./admin-forms";
import { LangBadge, StatusPill, chip, eyebrow, field, panel, pillAccent, pillGhost, pillPrimary, segment } from "./admin-ui";
import { POST_TYPES, SOURCE_LABELS, SUB_LABELS, Score } from "./post-editor";

const typeLabel = (t: PostType) => POST_TYPES.find((x) => x.value === t)?.label ?? t;
type Editable = "title" | "forWho" | "skip";

export function PostsBoard({ posts, gameNames }: { posts: Post[]; gameNames: Record<number, string> }) {
  const [type, setType] = useState<PostType | "all">("all");
  const [selected, setSelected] = useState(posts[0]?.id ?? null);
  const list = posts.filter((p) => type === "all" || p.type === type);
  const current = posts.find((p) => p.id === selected) ?? null;
  const gameLabel = (p: Post) => (p.gameIds.length ? p.gameIds.map((id) => gameNames[id]).filter(Boolean).slice(0, 2).join(", ") : "Umum");

  return (
    <div className="grid gap-[18px]">
      <div className="flex flex-wrap items-center gap-1.5">
        {[{ value: "all" as const, label: "Semua" }, ...POST_TYPES].map((t) => (
          <button key={t.value} type="button" aria-pressed={type === t.value} onClick={() => setType(t.value)} className={chip(type === t.value)}>{t.label}</button>
        ))}
        <Link href="/admin/posts/new" className={`${pillAccent} ml-auto`}>✎ Tulis baru</Link>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className={`${panel} overflow-hidden`}>
          {list.map((p, i) => (
            <button key={p.id} type="button" aria-current={p.id === selected} onClick={() => setSelected(p.id)}
              className={`grid w-full grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 px-[18px] py-4 text-left hover:bg-sunken ${i ? "border-t border-line" : ""} ${p.id === selected ? "bg-sunken shadow-[inset_3px_0_0_var(--meeple)]" : ""}`}>
              <span className={`${eyebrow} text-[11px] text-felt`}>{typeLabel(p.type)} · <span className="text-muted">{gameLabel(p)}</span></span>
              <span className="justify-self-end"><StatusPill status={p.status} /></span>
              <span className="font-display text-lg font-semibold leading-tight tracking-[-0.015em]">{postText(p, "id").text.title}</span>
              <span className="flex gap-1 self-center justify-self-end"><LangBadge code="ID" ok={Boolean(p.text.id)} /><LangBadge code="EN" ok={Boolean(p.text.en)} /></span>
              <span className="text-[13px] text-muted">{p.publishedAt?.slice(0, 10) ?? "Belum terbit"}</span>
            </button>
          ))}
          {!list.length && <p className="p-6 text-center text-muted">Belum ada konten.</p>}
        </div>
        {current && <QuickEdit key={`${current.id}-${current.updatedAt}`} post={current} />}
      </div>
    </div>
  );
}

/** Edits the short fields in place; the rest of the post is carried along untouched. */
function QuickEdit({ post }: { post: Post }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  const [lang, setLang] = useState<"id" | "en">("id");
  const [text, setText] = useState({ id: post.text.id, en: post.text.en });
  const [source, setSource] = useState<ReviewSource | "">(post.reviewSource ?? "");
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLInputElement>(null);
  const video = postVideo(post);
  const isReview = post.type === "reviews";
  const current = text[lang];

  const setField = (name: Editable, value: string) =>
    setText((s) => ({ ...s, [lang]: { excerpt: "", body: "", title: "", ...s[lang], [name]: value } }));
  const submit = (value: Post["status"]) => {
    if (status.current) status.current.value = value;
    form.current?.requestSubmit();
  };

  const missing = [
    !text.id?.title && "judul ID", !text.en?.title && "judul EN",
    isReview && (!text.id?.forWho || !text.id?.skip) && "cocok/lewati ID",
    isReview && (!text.en?.forWho || !text.en?.skip) && "cocok/lewati EN",
  ].filter(Boolean);

  const label = "grid gap-1.5 text-[13px] text-muted";
  const carried: Record<string, string | number> = {
    id: post.id, type: post.type, slug: post.slug, publishedAt: post.publishedAt?.slice(0, 10) ?? "",
    coverUrl: post.coverUrl ?? "", video: video ? videoLink(video) : "", videoFormat: post.videoFormat,
    duration: post.durationSec != null ? formatDuration(post.durationSec) : "", gameIds: post.gameIds.join(","),
    reviewSource: isReview ? source : "",
  };

  return (
    <div className="grid gap-2 lg:sticky lg:top-5">
    <form ref={form} action={action} className={`${panel} grid gap-[18px] p-[22px]`}>
      <input ref={status} type="hidden" name="status" defaultValue={post.status} />
      {Object.entries(carried).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      {(["id", "en"] as const).flatMap((code) => ["title", "excerpt", "body", "forWho", "skip"].map((f) => (
        <input key={`${code}-${f}`} type="hidden" name={`${f}_${code}`} value={text[code]?.[f as "title"] ?? ""} />
      )))}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`${eyebrow} text-muted`}>Edit · {typeLabel(post.type)}</p>
        <div className="flex gap-0.5 rounded-full border border-line p-[3px]">
          {(["id", "en"] as const).map((l) => (
            <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)} className={`${segment(lang === l)} font-mono text-xs! font-semibold uppercase`}>{l}</button>
          ))}
        </div>
      </div>
      <label className={label}>Judul
        <input value={current?.title ?? ""} onChange={(e) => setField("title", e.target.value)} maxLength={200} placeholder={lang === "en" ? "Belum diterjemahkan" : "Tulis di sini"}
          className={`${field} font-display text-lg! font-semibold text-ink`} />
      </label>
      {isReview && (
        <div className="grid gap-3.5">
          <label className={label}><span><span className="rounded-full bg-felt-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-felt">▲ Cocok untuk</span></span>
            <input value={current?.forWho ?? ""} onChange={(e) => setField("forWho", e.target.value)} maxLength={200} className={`${field} text-ink`} />
          </label>
          <label className={label}><span><span className="rounded-full bg-meeple-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-meeple">▼ Lewati jika</span></span>
            <input value={current?.skip ?? ""} onChange={(e) => setField("skip", e.target.value)} maxLength={200} className={`${field} text-ink`} />
          </label>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {SUBSCORE_KEYS.map((k) => <Score key={k} label={SUB_LABELS[k]} name={`sub_${k}`} value={post.subscores[k]} />)}
            <Score label="Skor akhir" name="score" value={post.score} accent />
          </div>
          <div className="grid gap-2">
            <p className="text-[13px] text-muted">Pengungkapan</p>
            <div className="flex flex-wrap gap-1.5">
              {REVIEW_SOURCES.map((s) => (
                <button key={s} type="button" aria-pressed={source === s} onClick={() => setSource(source === s ? "" : s)} className={`${chip(source === s)} rounded-xl!`}>{SOURCE_LABELS[s]}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      {state.error && <p role="alert" className="text-sm text-meeple">{state.error}</p>}
      <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3.5">
        <button type="button" onClick={() => submit("published")} disabled={pending} className={pillPrimary}>{pending ? "Menyimpan…" : post.status === "published" ? "Perbarui" : "Terbitkan"}</button>
        <Link href={`/admin/posts/${post.id}`} className={pillGhost}>Buka editor penuh →</Link>
        <span className={`ml-auto font-mono text-xs ${missing.length ? "text-meeple" : "text-felt"}`}>{missing.length ? `Kurang: ${missing.join(", ")}` : "Siap terbit"}</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {post.status === "published" && <Link href={postHref("id", post)} target="_blank" className="underline underline-offset-[3px]">Lihat di situs</Link>}
        <button type="button" onClick={() => submit("draft")} disabled={pending} className="underline underline-offset-[3px]">{post.status === "published" ? "Jadikan draf" : "Simpan draf"}</button>
      </div>
    </form>
    <div className="flex justify-end px-1"><DeleteButton action={deletePost} id={post.id} name={postText(post, "id").text.title} /></div>
    </div>
  );
}
