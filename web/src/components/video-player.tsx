"use client";

import { useState } from "react";
import { embedUrl, type VideoRef } from "@/lib/video";

/**
 * Click-to-load player for YouTube and TikTok: shows a picture first, so pages
 * with several videos stay fast and no third-party cookies are set until play.
 */
export function VideoPlayer({ video, thumb, portrait, title, playLabel }: {
  video: VideoRef; thumb: string | null; portrait?: boolean; title: string; playLabel: string;
}) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className={`relative w-full overflow-hidden rounded-xl bg-black ${portrait ? "mx-auto aspect-[9/16] max-w-[340px]" : "aspect-video"}`}>
      {playing ? (
        <iframe
          src={embedUrl(video)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={playLabel} className="group absolute inset-0 cursor-pointer">
          {thumb && (
            // eslint-disable-next-line @next/next/no-img-element -- video thumbnail or author cover from any host
            <img src={thumb} alt="" loading="lazy" className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          )}
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
