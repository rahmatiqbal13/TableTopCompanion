"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n";
import { listingHref, listingText } from "@/lib/i18n-paths";
import type { LocalListing } from "@/lib/types";
import { Cover } from "./cover";
import { Chip } from "./ui";

/** A directory section, with a filter once listings span more than one city. */
export function LocalBrowser({ listings, lang, allCities }: { listings: LocalListing[]; lang: Locale; allCities: string }) {
  const [city, setCity] = useState<string | null>(null);
  const cities = [...new Set(listings.map((l) => l.city).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const shown = city ? listings.filter((l) => l.city === city) : listings;
  return (
    <>
      {cities.length > 1 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <Chip active={city === null} onClick={() => setCity(null)}>{allCities}</Chip>
          {cities.map((c) => <Chip key={c} active={city === c} onClick={() => setCity(c)}>{c}</Chip>)}
        </div>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((l) => {
          const { text, lang: textLang } = listingText(l, lang);
          return (
            <Link key={l.id} href={listingHref(lang, l)} className="group block rounded-[18px] border border-line bg-card p-2.5">
              <div className="aspect-[4/3] overflow-hidden rounded-xl">
                <Cover name={l.name} src={l.imageUrl} fillText={68} />
              </div>
              <div className="px-2 pb-2 pt-3.5">
                {l.city && <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-felt">{l.city}</p>}
                <h2 className="mt-1 font-display text-[22px] font-bold leading-[1.1] tracking-[-0.02em] group-hover:underline">{l.name}</h2>
                {text.summary && <p lang={textLang} className="mt-2 line-clamp-3 text-sm text-muted">{text.summary}</p>}
                {text.schedule && <p lang={textLang} className="mt-2 text-sm">{text.schedule}</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </>
  );
}
