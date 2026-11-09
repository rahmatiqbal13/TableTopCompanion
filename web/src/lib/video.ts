import { parseYouTubeId, youTubeThumb } from "./youtube";
import type { Post } from "./types";

export interface VideoRef {
  platform: "youtube" | "tiktok";
  id: string;
}

const hostOf = (input: string): URL | null => {
  try {
    return new URL(input.trim());
  } catch {
    return null;
  }
};

export function isTikTokUrl(url: URL): boolean {
  const host = url.hostname.toLowerCase();
  return (url.protocol === "https:" || url.protocol === "http:") && (host === "tiktok.com" || host.endsWith(".tiktok.com"));
}

/** Video id from a full TikTok URL (…/video/123, …/embed/v2/123, …/player/v1/123). */
export function parseTikTokId(input: string | null | undefined): string | null {
  const url = hostOf(input ?? "");
  if (!url || !isTikTokUrl(url)) return null;
  return /\/(?:video|photo|embed(?:\/v2)?|player\/v1)\/(\d{15,25})(?:[/?#]|$)/.exec(url.pathname)?.[1] ?? null;
}

/** The app's share links (vm.tiktok.com/…, vt.tiktok.com/…, tiktok.com/t/…) hide the id behind a redirect. */
export function isTikTokShortLink(input: string | null | undefined): boolean {
  const url = hostOf(input ?? "");
  if (!url || !isTikTokUrl(url)) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  return host === "vm.tiktok.com" || host === "vt.tiktok.com" || (host === "tiktok.com" && url.pathname.startsWith("/t/"));
}

export function parseVideoLink(input: string | null | undefined): VideoRef | null {
  const youtube = parseYouTubeId(input);
  if (youtube) return { platform: "youtube", id: youtube };
  const tiktok = parseTikTokId(input);
  return tiktok ? { platform: "tiktok", id: tiktok } : null;
}

export function postVideo(post: Pick<Post, "youtubeId" | "tiktokId">): VideoRef | null {
  if (post.youtubeId) return { platform: "youtube", id: post.youtubeId };
  if (post.tiktokId) return { platform: "tiktok", id: post.tiktokId };
  return null;
}

/** A link the editor can show back; TikTok resolves the username from the id. */
export function videoLink(ref: VideoRef): string {
  return ref.platform === "youtube" ? `https://youtu.be/${ref.id}` : `https://www.tiktok.com/video/${ref.id}`;
}

export function embedUrl(ref: VideoRef): string {
  return ref.platform === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${ref.id}?autoplay=1&rel=0`
    : `https://www.tiktok.com/player/v1/${ref.id}?autoplay=1&rel=0&description=1&music_info=1`;
}

/** Only YouTube has a stable public thumbnail; TikTok's expire, so those posts need a cover. */
export const videoThumb = (ref: VideoRef | null): string | null => (ref?.platform === "youtube" ? youTubeThumb(ref.id) : null);

export const postThumb = (post: Pick<Post, "coverUrl" | "youtubeId" | "tiktokId">): string | null =>
  post.coverUrl ?? videoThumb(postVideo(post));

/** TikTok's player is always vertical. */
export const isPortrait = (post: Pick<Post, "videoFormat" | "tiktokId">) => post.videoFormat === "short" || Boolean(post.tiktokId);

/** Seconds from "6:12", "1:02:03" or "372"; null when it can't be read. */
export function parseDuration(input: string): number | null {
  const s = input.trim();
  if (!/^\d+(:[0-5]?\d){0,2}$/.test(s)) return null;
  return s.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60), s = seconds % 60;
  const ss = String(s).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}
