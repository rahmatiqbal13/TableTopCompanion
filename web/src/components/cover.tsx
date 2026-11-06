"use client";

import { useState } from "react";

/** Game cover: the image when it loads, otherwise generated art seeded by the name. */
export function Cover({ name, src, size = 64 }: { name: string; src: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  const initials = name.replace(/[^\p{L}\p{N} ]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

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
