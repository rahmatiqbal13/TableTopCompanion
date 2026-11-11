"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import { savePost, uploadImage, type FormState } from "@/app/admin/actions";
import { slugify } from "@/lib/format";
import { postHref } from "@/lib/i18n-paths";
import { formatDuration, isTikTokShortLink, parseVideoLink, postVideo, videoLink } from "@/lib/video";
import { REVIEW_SOURCES, SUBSCORE_KEYS, type Game, type Post, type PostType, type ReviewSource, type VideoFormat } from "@/lib/types";
import { StatusPill, chip, eyebrow, field as input, panel, pillGhost, pillPrimary, segment } from "./admin-ui";
import { Markdown } from "./markdown";

export const POST_TYPES: { value: PostType; label: string }[] = [
  { value: "reviews", label: "Ulasan" }, { value: "videos", label: "Video" },
  { value: "news", label: "Berita" }, { value: "guides", label: "Panduan" },
];
export const SUB_LABELS = { teach: "Mudah diajarkan", interaction: "Interaksi", replay: "Ingin main lagi" };
export const SOURCE_LABELS: Record<ReviewSource, string> = { bought: "Dibeli sendiri", publisher: "Kiriman penerbit", borrowed: "Dipinjam" };

const FIELDS = ["title", "excerpt", "body", "forWho", "skip"] as const;
type Lang = "id" | "en";

const TOOLS: { label: string; hint: string; before: string; after?: string; line?: boolean }[] = [
  { label: "H2", hint: "Subjudul", before: "## ", line: true },
  { label: "B", hint: "Tebal", before: "**", after: "**" },
  { label: "•", hint: "Daftar", before: "- ", line: true },
  { label: "❝", hint: "Kutipan", before: "> ", line: true },
  { label: "🔗", hint: "Tautan", before: "[", after: "](https://)" },
];

const sideLabel = "grid gap-1.5 text-[13px] text-muted";

export function PostEditor({ post, games, canUpload }: { post: Post | null; games: Pick<Game, "id" | "name" | "year">[]; canUpload: boolean }) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePost, {});
  const [type, setType] = useState<PostType>(post?.type ?? "reviews");
  const [tab, setTab] = useState<Lang>("id");
  const [preview, setPreview] = useState(false);
  const [text, setText] = useState({
    id: post?.text.id ?? { title: "", excerpt: "", body: "" },
    en: post?.text.en ?? { title: "", excerpt: "", body: "" },
  });
  const [slug, setSlug] = useState(post?.slug ?? "");
  const existingVideo = post ? postVideo(post) : null;
  const [link, setLink] = useState(existingVideo ? videoLink(existingVideo) : "");
  const [format, setFormat] = useState<VideoFormat>(post?.videoFormat ?? "long");
  const [cover, setCover] = useState(post?.coverUrl ?? "");
  const [gameIds, setGameIds] = useState<number[]>(post?.gameIds ?? []);
  const [source, setSource] = useState<ReviewSource | "">(post?.reviewSource ?? "");
  const form = useRef<HTMLFormElement>(null);
  const status = useRef<HTMLInputElement>(null);
  const body = useRef<HTMLTextAreaElement>(null);

  const video = parseVideoLink(link);
  const shortLink = isTikTokShortLink(link);
  const autoSlug = slugify(text.id.title || text.en.title);
  const current = text[tab];
  const isReview = type === "reviews";
  const words = current.body.trim() ? current.body.trim().split(/\s+/).length : 0;

  const changeLink = (value: string) => {
    setLink(value);
    // TikToks and YouTube Shorts are vertical; the editor can still change this.
    if (/\/shorts\/|tiktok\.com/i.test(value)) setFormat("short");
  };
  const setField = (name: (typeof FIELDS)[number], value: string) =>
    setText((s) => ({ ...s, [tab]: { ...s[tab], [name]: value } }));

  /** Wraps the selection (or prefixes its line) and leaves the caret after the inserted text. */
  const insert = (before: string, after = "", line = false) => {
    const area = body.current;
    if (!area) return;
    const { selectionStart: a, selectionEnd: b, value } = area;
    const start = line ? value.lastIndexOf("\n", a - 1) + 1 : a;
    const selected = value.slice(start, b);
    setField("body", value.slice(0, start) + before + selected + after + value.slice(b));
    requestAnimationFrame(() => {
      area.focus();
      const caret = start + before.length + selected.length;
      area.setSelectionRange(caret, caret);
    });
  };

  // Two buttons choose the status, so saving never depends on which one Enter would hit.
  const submit = (value: Post["status"]) => {
    if (status.current) status.current.value = value;
    form.current?.requestSubmit();
  };

  const checks = [
    { ok: Boolean(text.id.title && text.en.title), label: "Judul ID & EN" },
    { ok: Boolean(current.excerpt), label: "Ringkasan diisi" },
    { ok: type === "videos" ? Boolean(video || shortLink) : words >= 150, label: type === "videos" ? "Tautan video" : `Minimal 150 kata (${words})` },
    ...(isReview ? [
      { ok: Boolean(current.forWho && current.skip), label: "Cocok untuk & Lewati jika" },
      { ok: source !== "", label: "Pengungkapan dipilih" },
    ] : []),
  ];

  return (
    <form ref={form} action={action} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="id" value={post?.id ?? ""} />
      <input ref={status} type="hidden" name="status" defaultValue={post?.status ?? "draft"} />
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="gameIds" value={gameIds.join(",")} />
      <input type="hidden" name="reviewSource" value={isReview ? source : ""} />
      {(["id", "en"] as const).flatMap((code) => FIELDS.map((f) => (
        <input key={`${code}-${f}`} type="hidden" name={`${f}_${code}`} value={text[code][f] ?? ""} />
      )))}

      <div className={`${panel} grid gap-[18px] p-[clamp(18px,3vw,32px)]`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap gap-1.5">
            {POST_TYPES.map((t) => (
              <button key={t.value} type="button" aria-pressed={type === t.value} onClick={() => setType(t.value)} className={`${chip(type === t.value)} min-h-9! px-3! text-[13px]!`}>{t.label}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex gap-0.5 rounded-full border border-line p-[3px]">
              {(["id", "en"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={tab === l} onClick={() => setTab(l)} className={`${segment(tab === l)} font-mono text-xs! font-semibold uppercase`}>{l}</button>
              ))}
            </div>
            <div className="flex gap-0.5 rounded-full border border-line p-[3px]">
              <button type="button" aria-pressed={!preview} onClick={() => setPreview(false)} className={segment(!preview)}>Tulis</button>
              <button type="button" aria-pressed={preview} onClick={() => setPreview(true)} className={segment(preview)}>Pratinjau</button>
            </div>
          </div>
        </div>

        {preview ? (
          <article className="grid max-w-[68ch] gap-3.5">
            <p className={`${eyebrow} text-felt`}>{POST_TYPES.find((t) => t.value === type)?.label}</p>
            <h2 className="text-balance font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.05] tracking-[-0.03em]">{current.title || "Tanpa judul"}</h2>
            {current.excerpt && <p className="text-lg leading-normal text-muted">{current.excerpt}</p>}
            <Markdown source={current.body} playLabel="Putar" />
            {isReview && (current.forWho || current.skip) && (
              <div className="mt-2.5 grid gap-2.5 border-t border-dashed border-line pt-4 text-[15px]">
                {current.forWho && <p className="flex gap-2.5"><span className="shrink-0 rounded-full bg-felt-soft px-2.5 py-[3px] font-mono text-[11px] font-semibold text-felt">▲ Cocok untuk</span>{current.forWho}</p>}
                {current.skip && <p className="flex gap-2.5"><span className="shrink-0 rounded-full bg-meeple-soft px-2.5 py-[3px] font-mono text-[11px] font-semibold text-meeple">▼ Lewati jika</span>{current.skip}</p>}
              </div>
            )}
          </article>
        ) : (
          <div className="grid gap-4">
            <input value={current.title} onChange={(e) => setField("title", e.target.value)} maxLength={200} placeholder="Judul" aria-label="Judul"
              className="bg-transparent font-display text-[clamp(28px,3.4vw,42px)] font-bold leading-[1.05] tracking-[-0.03em] outline-none" />
            <textarea value={current.excerpt} onChange={(e) => setField("excerpt", e.target.value)} rows={2} maxLength={400} aria-label="Ringkasan"
              placeholder="Ringkasan singkat untuk kartu dan pratinjau tautan"
              className="resize-y border-b border-dashed border-line bg-transparent pb-3 text-[17px] leading-normal text-muted outline-none" />
            <div className="sticky top-2 z-[2] flex flex-wrap gap-1 rounded-xl bg-sunken p-1.5">
              {TOOLS.map((t) => (
                <button key={t.label} type="button" title={t.hint} aria-label={t.hint} onClick={() => insert(t.before, t.after, t.line)}
                  className="min-h-9 min-w-10 rounded-lg px-2.5 font-mono text-[13px] font-semibold hover:bg-card">{t.label}</button>
              ))}
              <span className="ml-auto self-center pr-1.5 font-mono text-xs text-muted">{words} kata · {Math.max(1, Math.round(words / 200))} mnt baca</span>
            </div>
            <textarea ref={body} value={current.body} onChange={(e) => setField("body", e.target.value)} aria-label="Isi"
              placeholder="Mulai menulis… Gunakan ## untuk subjudul, - untuk daftar, > untuk kutipan."
              style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0 31px, var(--sunken) 31px 32px)" }}
              className="min-h-[420px] resize-y bg-transparent py-1 text-[17px] leading-8 outline-none" />
            <p className="text-[13px] text-muted">Tautan YouTube atau TikTok di baris sendiri menjadi pemutar. Bahasa yang dikosongkan dilewati; pembaca melihat bahasa lainnya.</p>
          </div>
        )}
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-5 lg:max-h-[calc(100vh-2.5rem)] lg:overflow-y-auto">
        <div className={`${panel} grid gap-3.5 p-[18px]`}>
          <div className="flex items-center justify-between">
            <StatusPill status={post?.status ?? "draft"} />
            <span className="font-mono text-xs text-muted">{post ? `Diubah ${post.updatedAt.slice(0, 10)}` : "Belum disimpan"}</span>
          </div>
          <div className="grid gap-2">
            <button type="button" onClick={() => submit("published")} disabled={pending} className={pillPrimary}>{pending ? "Menyimpan…" : post?.status === "published" ? "Perbarui" : "Terbitkan"}</button>
            <button type="button" onClick={() => submit("draft")} disabled={pending} className={pillGhost}>{post?.status === "published" ? "Jadikan draf" : "Simpan draf"}</button>
          </div>
          {state.error && <p role="alert" className="text-sm text-meeple">{state.error}</p>}
          <ul className="grid gap-1.5 border-t border-dashed border-line pt-3 text-[13px]">
            {checks.map((c) => <li key={c.label} className={`flex gap-2 ${c.ok ? "text-felt" : "text-muted"}`}><span aria-hidden>{c.ok ? "✓" : "○"}</span>{c.label}</li>)}
          </ul>
        </div>

        <div className={`${panel} grid gap-3.5 p-[18px]`}>
          <p className="text-[13px] text-muted">Gambar sampul</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- any external URL an editor pastes */}
          {cover && <img src={cover} alt="" className="aspect-[16/10] w-full rounded-xl bg-sunken object-cover" />}
          <input name="coverUrl" type="url" value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://…" aria-label="URL gambar sampul" className={input} />
          <ImageUpload enabled={canUpload} onUploaded={(url) => setCover((c) => c || url)} />
          <GamePicker games={games} value={gameIds} onChange={setGameIds} />
          <label className={sideLabel}>Tautan
            <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={autoSlug || "otomatis dari judul"} className={`${input} font-mono text-xs!`} />
            <span className="break-all font-mono text-[11px]">{postHref(tab, { type, slug: slug || autoSlug || "…" })}</span>
          </label>
          <label className={sideLabel}>Tanggal terbit
            <input name="publishedAt" type="date" defaultValue={post?.publishedAt?.slice(0, 10) ?? ""} className={input} />
          </label>
          {isReview && (
            <div className="grid gap-2">
              <p className="text-[13px] text-muted">Pengungkapan</p>
              <div className="flex flex-wrap gap-1.5">
                {REVIEW_SOURCES.map((s) => (
                  <button key={s} type="button" aria-pressed={source === s} onClick={() => setSource(source === s ? "" : s)} className={`${chip(source === s)} min-h-9! rounded-[10px]! px-3! text-[13px]!`}>{SOURCE_LABELS[s]}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={`${panel} grid gap-3.5 p-[18px]`}>
          <label className={sideLabel}>Tautan video {type === "videos" && <span className="text-meeple">wajib</span>}
            <input name="video" value={link} onChange={(e) => changeLink(e.target.value)} placeholder="YouTube atau TikTok" className={input} />
            {link && (
              <span className={video || shortLink ? "text-felt" : "text-meeple"}>
                {video ? `✓ Video ${video.platform === "youtube" ? "YouTube" : "TikTok"}` : shortLink ? "✓ Tautan bagikan TikTok, dibaca saat disimpan" : "Bukan tautan YouTube atau TikTok"}
              </span>
            )}
          </label>
          {(video || shortLink) && (
            <div className="grid grid-cols-[1fr_88px] gap-2.5">
              <label className={sideLabel}>Format
                <select name="videoFormat" value={format} onChange={(e) => setFormat(e.target.value as VideoFormat)} className={input}>
                  <option value="long">Panjang</option>
                  <option value="short">Pendek (vertikal)</option>
                </select>
              </label>
              <label className={sideLabel}>Durasi
                <input name="duration" defaultValue={post?.durationSec != null ? formatDuration(post.durationSec) : ""} placeholder="6:12" className={input} />
              </label>
            </div>
          )}
        </div>

        {isReview && (
          <div className={`${panel} grid gap-3 p-[18px]`}>
            <p className={`${eyebrow} text-muted`}>Lembar skor</p>
            <input value={current.forWho ?? ""} onChange={(e) => setField("forWho", e.target.value)} maxLength={200} placeholder="▲ Cocok untuk…" aria-label="Cocok untuk" className={input} />
            <input value={current.skip ?? ""} onChange={(e) => setField("skip", e.target.value)} maxLength={200} placeholder="▼ Lewati jika…" aria-label="Lewati jika" className={input} />
            <div className="grid grid-cols-2 gap-2">
              {SUBSCORE_KEYS.map((k) => <Score key={k} label={SUB_LABELS[k]} name={`sub_${k}`} value={post?.subscores[k]} />)}
              <Score label="Skor akhir" name="score" value={post?.score} accent />
            </div>
          </div>
        )}
      </aside>
    </form>
  );
}

export function Score({ label, name, value, accent }: { label: string; name: string; value?: number | null; accent?: boolean }) {
  return (
    <label className="grid gap-1 rounded-[10px] bg-sunken px-2.5 py-2 text-[11px] text-muted">{label}
      <input name={name} type="number" min={0} max={10} step={0.1} defaultValue={value ?? ""} placeholder="–"
        className={`w-full bg-transparent font-display text-[22px] font-extrabold outline-none ${accent ? "text-meeple" : "text-ink"}`} />
    </label>
  );
}

export function ImageUpload({ enabled, onUploaded }: { enabled: boolean; onUploaded: (url: string) => void }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ url?: string; error?: string }>({});
  if (!enabled) {
    return <p className="text-xs text-muted">Hubungkan Vercel Blob untuk mengunggah gambar; sementara ini tempel URL gambar.</p>;
  }
  return (
    <div className="space-y-1 text-xs">
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" disabled={pending} aria-label="Unggah gambar"
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
      {pending && <p className="text-muted">Mengunggah…</p>}
      {result.error && <p className="text-meeple">{result.error}</p>}
      {result.url && (
        <p className="text-muted">Terunggah. Untuk isi tulisan, tempel: <code className="select-all rounded bg-sunken px-1">![]({result.url})</code></p>
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
    <div className="grid gap-1.5">
      <p className="text-[13px] text-muted">Game terkait</p>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((id) => (
            <li key={id} className="flex items-center gap-1 rounded-full bg-felt-soft py-0.5 pl-3 pr-1 text-sm">
              {byId.get(id)?.name ?? `#${id}`}
              <button type="button" aria-label="Lepas" onClick={() => onChange(value.filter((x) => x !== id))} className="grid size-5 place-items-center rounded-full hover:bg-card">×</button>
            </li>
          ))}
        </ul>
      )}
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari game untuk ditautkan" aria-label="Cari game untuk ditautkan" className={input} />
      {matches.length > 0 && (
        <ul className="overflow-hidden rounded-xl border border-line text-sm">
          {matches.map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => { onChange([...value, g.id]); setQ(""); }} className="flex w-full justify-between gap-2 px-3 py-1.5 text-left hover:bg-sunken">
                <span>{g.name}</span><span className="text-muted">{g.year}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
