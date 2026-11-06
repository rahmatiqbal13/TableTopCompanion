const ID = /^[A-Za-z0-9_-]{11}$/;

/** Extracts the 11-character video id from any common YouTube URL (or a bare id). */
export function parseYouTubeId(input: string | null | undefined): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  if (ID.test(s)) return s;
  let url: URL;
  try {
    url = new URL(s);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    id = url.searchParams.get("v");
    const m = /^\/(embed|shorts|live|v)\/([^/?#]+)/.exec(url.pathname);
    if (!id && m) id = m[2];
  }
  return id && ID.test(id) ? id : null;
}

export const youTubeThumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
