"use client";

import { useState } from "react";

/**
 * Game cover: the image when it loads, otherwise generated art seeded by the name.
 * Square at `size` by default; with `fillText` it fills its parent instead and
 * the initials are that many pixels tall (`faint` when something sits on top).
 */
export function Cover({ name, src, size = 64, fillText, faint }: { name: string; src: string | null; size?: number; fillText?: number; faint?: boolean }) {
  const [failed, setFailed] = useState(false);
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const initials = name.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  if (fillText !== undefined) {
    return src && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element -- external BGG images; avoids image-optimizer quota
      <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} className="size-full object-cover" />
    ) : (
      <div
        aria-hidden
        className={`grid size-full place-items-center font-display font-extrabold tracking-[-0.05em] ${faint ? "text-white/20" : "text-white/90"}`}
        style={{ fontSize: fillText, background: `linear-gradient(135deg, oklch(0.58 0.1 ${hue}), oklch(0.36 0.08 ${(hue + 40) % 360}))` }}
      >
        {initials || "?"}
      </div>
    );
  }

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- external BGG images; avoids image-optimizer quota
      <img
        src={src} alt="" width={size} height={size} loading="lazy" onError={() => setFailed(true)}
        className="shrink-0 rounded-lg border border-line bg-sunken object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      aria-hidden
      className="grid shrink-0 place-items-center rounded-lg font-display font-semibold text-white/90"
      style={{
        width: size, height: size, fontSize: size * 0.32,
        background: `linear-gradient(135deg, oklch(0.55 0.09 ${hue}), oklch(0.38 0.07 ${(hue + 40) % 360}))`,
      }}
    >
      {initials || "?"}
    </div>
  );
}
