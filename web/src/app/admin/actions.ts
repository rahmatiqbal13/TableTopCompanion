"use server";

import { put } from "@vercel/blob";
import { eq, sql } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { endSession, passwordMatches, requireAdmin, requireEditor, startSession } from "@/lib/auth";
import { CATALOG_TAG, LOCAL_TAG, POSTS_TAG } from "@/lib/data";
import { slugify } from "@/lib/format";
import { isTikTokShortLink, isTikTokUrl, parseDuration, parseTikTokId, parseVideoLink, type VideoRef } from "@/lib/video";
import { LOCAL_KINDS, REVIEW_SOURCES, SUBSCORE_KEYS, VIDEO_FORMATS, type LocalListing, type SubScores } from "@/lib/types";
import { db, hasDatabase } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export interface FormState {
  error?: string;
  ok?: string;
}

// Naive in-memory throttle; per serverless instance, enough to slow guessing.
const attempts = new Map<string, { n: number; until: number }>();

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const bucket = attempts.get("admin") ?? { n: 0, until: 0 };
  if (bucket.until > Date.now()) return { error: "Too many attempts. Try again in a minute." };
  if (!passwordMatches(String(form.get("password") ?? ""))) {
    bucket.n++;
    if (bucket.n >= 5) Object.assign(bucket, { n: 0, until: Date.now() + 60_000 });
    attempts.set("admin", bucket);
    return { error: "Wrong password." };
  }
  attempts.delete("admin");
  await startSession();
  redirect("/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin");
}

const NO_DB = "No database connected (DATABASE_URL is not set), so changes cannot be saved.";

type Level = "admin" | "editor";
const check = (level: Level) => (level === "admin" ? requireAdmin() : requireEditor());

/** For actions without a result: throws when not allowed. */
async function guard(level: Level = "admin") {
  await check(level);
  if (!hasDatabase) throw new Error(NO_DB);
}

/** For form actions: returns an error message instead of throwing when the database is missing. */
async function writeBlocked(level: Level = "admin"): Promise<string | null> {
  await check(level);
  return hasDatabase ? null : NO_DB;
}

const intList = z
  .string()
  .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean).map(Number))
  .pipe(z.array(z.number().int().min(1).max(100)));
const textList = z
  .string()
  .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
  .pipe(z.array(z.string().max(80)).max(40));
const optionalInt = z.preprocess((v) => (v === "" || v === null ? null : v), z.coerce.number().int().min(0).nullable());
const optionalUrl = z.preprocess((v) => (v === "" ? null : v), z.url({ protocol: /^https?$/ }).nullable());

const gameSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  year: z.coerce.number().int().min(1800).max(2100),
  genreId: z.coerce.number().int().positive(),
  bggId: optionalInt,
  maxPlayers: optionalInt,
  votes: optionalInt,
  imageUrl: optionalUrl,
  linkUrl: optionalUrl,
  bestPlayers: intList,
  recPlayers: intList,
  categories: textList,
  mechanics: textList,
  description: z.string().max(4000).transform((s) => s.trim() || null),
});

export async function saveGame(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await writeBlocked();
  if (blocked) return { error: blocked };
  const parsed = gameSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };

  const criteria = await db().select().from(schema.criteria);
  const values: Record<string, number> = {};
  for (const c of criteria) {
    const raw = form.get(`value.${c.key}`);
    const v = Number(raw);
    if (raw === null || raw === "" || !Number.isFinite(v)) return { error: `${c.name}: enter a number` };
    values[c.key] = v;
  }

  const row = { ...parsed.data, values, updatedAt: sql`now()` };
  const id = Number(form.get("id"));
  try {
    if (id) await db().update(schema.games).set(row).where(eq(schema.games.id, id));
    else await db().insert(schema.games).values(row);
  } catch (e) {
    return { error: e instanceof Error && /unique/i.test(e.message) ? "Another game already uses that BGG id." : "Could not save the game." };
  }
  updateTag(CATALOG_TAG);
  redirect("/admin/catalog?saved=game");
}

export async function deleteGame(form: FormData) {
  await guard();
  await db().delete(schema.games).where(eq(schema.games.id, Number(form.get("id"))));
  updateTag(CATALOG_TAG);
}

const criterionSchema = z.object({
  id: z.coerce.number().int().min(0),
  key: z.string().regex(/^[a-zA-Z][a-zA-Z0-9]{1,39}$/, "Key: letters and digits, starting with a letter"),
  name: z.string().trim().min(1).max(80),
  unit: z.string().trim().max(20),
  hint: z.string().trim().max(300),
  defaultWeight: z.coerce.number().min(0).max(1),
  type: z.enum(["benefit", "cost"]),
  sort: z.coerce.number().int().min(0).max(999),
});

export async function saveCriterion(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await writeBlocked();
  if (blocked) return { error: blocked };
  const parsed = criterionSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  const { id, ...data } = parsed.data;
  try {
    if (id) {
      // The key is the join to game values, so it is immutable after creation.
      const { key: _key, ...rest } = data;
      await db().update(schema.criteria).set(rest).where(eq(schema.criteria.id, id));
    } else {
      const fill = Number(form.get("fill"));
      await db().insert(schema.criteria).values(data);
      // Give every game a starting value so it is not filtered out as "missing data".
      await db().update(schema.games).set({
        values: sql`${schema.games.values} || jsonb_build_object(${data.key}::text, ${Number.isFinite(fill) ? fill : 0}::float8)`,
      });
    }
  } catch {
    return { error: "Could not save (is the key already used?)" };
  }
  updateTag(CATALOG_TAG);
  return { ok: "Saved" };
}

export async function deleteCriterion(form: FormData) {
  await guard();
  await db().delete(schema.criteria).where(eq(schema.criteria.id, Number(form.get("id"))));
  updateTag(CATALOG_TAG);
}

export async function saveGenre(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await writeBlocked();
  if (blocked) return { error: blocked };
  const name = String(form.get("name") ?? "").trim();
  if (!name || name.length > 80) return { error: "Enter a genre name" };
  const id = Number(form.get("id"));
  try {
    if (id) await db().update(schema.genres).set({ name }).where(eq(schema.genres.id, id));
    else await db().insert(schema.genres).values({ name });
  } catch {
    return { error: "That genre already exists" };
  }
  updateTag(CATALOG_TAG);
  return { ok: "Saved" };
}

export async function deleteGenre(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await writeBlocked();
  if (blocked) return { error: blocked };
  try {
    await db().delete(schema.genres).where(eq(schema.genres.id, Number(form.get("id"))));
  } catch {
    return { error: "Genre is still used by games; move them first." };
  }
  updateTag(CATALOG_TAG);
  return { ok: "Deleted" };
}

// ---------------------------------------------------------------------------
// Posts (news, reviews, videos, guides)
// ---------------------------------------------------------------------------

const postSchema = z.object({
  type: z.enum(["news", "reviews", "videos", "guides"]),
  status: z.enum(["draft", "published"]),
  slug: z.string().trim().max(120),
  publishedAt: z.string().trim(),
  coverUrl: optionalUrl,
  video: z.string().trim().max(300),
  videoFormat: z.enum(VIDEO_FORMATS).default("long"),
  duration: z.string().trim().max(10).default(""),
  // Review-only fields aren't in the form for other post types.
  score: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().min(0).max(10).nullable()),
  reviewSource: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.enum(REVIEW_SOURCES).nullable()),
  gameIds: z.string().transform((s) => s.split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0)),
});

const langText = (form: FormData, lang: "id" | "en") => {
  const title = String(form.get(`title_${lang}`) ?? "").trim().slice(0, 200);
  if (!title) return undefined;
  return {
    title,
    excerpt: String(form.get(`excerpt_${lang}`) ?? "").trim().slice(0, 400),
    body: String(form.get(`body_${lang}`) ?? "").slice(0, 100_000),
    forWho: String(form.get(`forWho_${lang}`) ?? "").trim().slice(0, 200) || undefined,
    skip: String(form.get(`skip_${lang}`) ?? "").trim().slice(0, 200) || undefined,
  };
};

/** Reads a video link, following TikTok share links (only ever within tiktok.com) to find the id. */
async function resolveVideo(link: string): Promise<VideoRef | null> {
  const direct = parseVideoLink(link);
  if (direct || !isTikTokShortLink(link)) return direct;
  try {
    let next = link;
    for (let hop = 0; hop < 3; hop++) {
      const res = await fetch(next, { redirect: "manual", signal: AbortSignal.timeout(5000) });
      const target = res.headers.get("location");
      if (!target) return null;
      const url = new URL(target, next);
      if (!isTikTokUrl(url)) return null;
      const id = parseTikTokId(url.href);
      if (id) return { platform: "tiktok", id };
      next = url.href;
    }
  } catch { /* unreachable or malformed: reported as an invalid link */ }
  return null;
}

export async function savePost(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await writeBlocked("editor");
  if (blocked) return { error: blocked };
  const parsed = postSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const d = parsed.data;

  const text = { id: langText(form, "id"), en: langText(form, "en") };
  if (!text.id && !text.en) return { error: "Write a title in at least one language." };

  const video = d.video ? await resolveVideo(d.video) : null;
  if (d.video && !video) {
    return { error: isTikTokShortLink(d.video)
      ? "Couldn't read that TikTok share link. Open it in a browser and paste the full tiktok.com/@user/video/… address."
      : "That doesn't look like a YouTube or TikTok link." };
  }
  if (d.type === "videos" && !video) return { error: "Video posts need a YouTube or TikTok link." };
  const durationSec = d.duration && video ? parseDuration(d.duration) : null;
  if (d.duration && video && durationSec === null) return { error: "Write the duration like 6:12." };

  const subscores: SubScores = {};
  if (d.type === "reviews") {
    for (const key of SUBSCORE_KEYS) {
      const raw = String(form.get(`sub_${key}`) ?? "").trim();
      if (!raw) continue;
      const value = Number(raw);
      if (!Number.isFinite(value) || value < 0 || value > 10) return { error: "Sub-scores must be between 0 and 10." };
      subscores[key] = value;
    }
  }

  const slug = slugify(d.slug || (text.id ?? text.en)!.title);
  if (!slug) return { error: "Slug is empty." };
  const publishedAt = d.publishedAt ? new Date(d.publishedAt) : d.status === "published" ? new Date() : null;
  if (publishedAt && Number.isNaN(publishedAt.getTime())) return { error: "Invalid publish date." };

  const row = {
    type: d.type, status: d.status, slug, publishedAt, coverUrl: d.coverUrl,
    youtubeId: video?.platform === "youtube" ? video.id : null,
    tiktokId: video?.platform === "tiktok" ? video.id : null,
    videoFormat: video ? d.videoFormat : ("long" as const), durationSec,
    score: d.type === "reviews" ? d.score : null,
    reviewSource: d.type === "reviews" ? d.reviewSource : null, subscores, gameIds: d.gameIds,
    text: Object.fromEntries(Object.entries(text).filter(([, v]) => v)), updatedAt: sql`now()`,
  };
  const id = Number(form.get("id"));
  try {
    if (id) await db().update(schema.posts).set(row).where(eq(schema.posts.id, id));
    else await db().insert(schema.posts).values(row);
  } catch (e) {
    return { error: e instanceof Error && /unique/i.test(e.message) ? `The slug "${slug}" is already used.` : "Could not save the post." };
  }
  updateTag(POSTS_TAG);
  redirect("/admin/posts?saved=1");
}

export async function deletePost(form: FormData) {
  await guard("editor");
  await db().delete(schema.posts).where(eq(schema.posts.id, Number(form.get("id"))));
  updateTag(POSTS_TAG);
}


// ---------------------------------------------------------------------------
// "Play near you" directory
// ---------------------------------------------------------------------------

const blankToNull = (max: number) => z.string().trim().max(max).default("").transform((s) => s || null);

const listingSchema = z.object({
  kind: z.enum(LOCAL_KINDS),
  status: z.enum(["draft", "published"]),
  name: z.string().trim().min(1, "Name is required").max(160),
  slug: z.string().trim().max(120),
  city: z.string().trim().max(80),
  address: blankToNull(300),
  contact: blankToNull(120),
  designer: blankToNull(120),
  gameId: z.preprocess((v) => (v === "" || v === undefined ? null : v), z.coerce.number().int().positive().nullable()),
  mapUrl: optionalUrl,
  websiteUrl: optionalUrl,
  instagramUrl: optionalUrl,
  imageUrl: optionalUrl,
});

const listingLangText = (form: FormData, lang: "id" | "en") => {
  const summary = String(form.get(`summary_${lang}`) ?? "").trim().slice(0, 300);
  const schedule = String(form.get(`schedule_${lang}`) ?? "").trim().slice(0, 200);
  const body = String(form.get(`body_${lang}`) ?? "").slice(0, 20_000);
  return summary || schedule || body.trim() ? { summary, schedule, body } : undefined;
};

export async function saveListing(_: FormState, form: FormData): Promise<FormState> {
  const blocked = await writeBlocked("editor");
  if (blocked) return { error: blocked };
  const parsed = listingSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  const { slug: rawSlug, ...d } = parsed.data;
  const slug = slugify(rawSlug || d.name);
  if (!slug) return { error: "Slug is empty." };

  const text: LocalListing["text"] = { id: listingLangText(form, "id"), en: listingLangText(form, "en") };
  const row = {
    ...d, slug,
    // These two only apply to Indonesian-made games.
    designer: d.kind === "games" ? d.designer : null, gameId: d.kind === "games" ? d.gameId : null,
    text: Object.fromEntries(Object.entries(text).filter(([, v]) => v)), updatedAt: sql`now()`,
  };
  const id = Number(form.get("id"));
  try {
    if (id) await db().update(schema.localListings).set(row).where(eq(schema.localListings.id, id));
    else await db().insert(schema.localListings).values(row);
  } catch (e) {
    return { error: e instanceof Error && /unique/i.test(e.message) ? `The slug "${slug}" is already used.` : "Could not save the listing." };
  }
  updateTag(LOCAL_TAG);
  redirect("/admin/local?saved=1");
}

export async function deleteListing(form: FormData) {
  await guard("editor");
  await db().delete(schema.localListings).where(eq(schema.localListings.id, Number(form.get("id"))));
  updateTag(LOCAL_TAG);
}

const MAX_UPLOAD = 4 * 1024 * 1024;

/** Uploads an image to Vercel Blob and returns its public URL. */
export async function uploadImage(form: FormData): Promise<{ url?: string; error?: string }> {
  await requireEditor();
  if (!process.env.BLOB_READ_WRITE_TOKEN) return { error: "Image upload needs a Vercel Blob store (BLOB_READ_WRITE_TOKEN)." };
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { error: "Choose an image." };
  if (!/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) return { error: "Use PNG, JPG, WebP, GIF or AVIF." };
  if (file.size > MAX_UPLOAD) return { error: "Images must be under 4 MB." };
  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const blob = await put(`posts/${slugify(file.name.replace(/\.[^.]+$/, "")) || "image"}.${ext}`, file, {
    access: "public", addRandomSuffix: true, contentType: file.type,
  });
  return { url: blob.url };
}

// ---------------------------------------------------------------------------
// Users (accounts): roles and blocking
// ---------------------------------------------------------------------------

/** Admins can't change their own role or block themselves (prevents lock-outs). */
async function targetIsSelf(id: string) {
  const { currentAccount } = await import("@/lib/account");
  return (await currentAccount())?.profile.id === id;
}

const userId = z.uuid();

export async function setUserRole(form: FormData) {
  await guard();
  const id = userId.parse(form.get("id"));
  const role = z.enum(["user", "editor", "admin"]).parse(form.get("role"));
  if (await targetIsSelf(id)) return;
  await db().update(schema.profiles).set({ role }).where(eq(schema.profiles.id, id));
}

export async function setUserBanned(form: FormData) {
  await guard();
  const id = userId.parse(form.get("id"));
  if (await targetIsSelf(id)) return;
  await db().update(schema.profiles).set({ banned: form.get("banned") === "true" }).where(eq(schema.profiles.id, id));
  // Blocked users' ratings drop out of the community averages.
  updateTag(CATALOG_TAG);
}

/** "Refresh site data": use after editing tables directly in Supabase without a webhook. */
export async function refreshSiteData() {
  await requireEditor();
  updateTag(CATALOG_TAG);
  updateTag(POSTS_TAG);
  updateTag(LOCAL_TAG);
}
