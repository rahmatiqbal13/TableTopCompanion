"use client";

import { useState } from "react";
import { youTubeThumb } from "@/lib/youtube";

/**
 * Click-to-load YouTube player: shows the thumbnail first, so pages with
 * several videos stay fast and no YouTube cookies are set until play.
 */
export function YouTubeEmbed({ id, title, playLabel }: { id: string; title: string; playLabel: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      ) : (
        <button type="button" onClick={() => setPlaying(true)} aria-label={playLabel} className="group absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element -- YouTube thumbnail */}
          <img src={youTubeThumb(id)} alt="" loading="lazy" className="size-full object-cover opacity-90 transition-opacity group-hover:opacity-100" />
          <span className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/70 text-white transition-transform group-hover:scale-110">
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden><path fill="currentColor" d="M8 5v14l11-7z" /></svg>
          </span>
        </button>
      )}
    </div>
  );
}
