"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmt, type Dict, type Locale } from "@/i18n";
import { genreName } from "@/lib/format";
import { gameHref } from "@/lib/i18n-paths";
import type { Catalog, Game } from "@/lib/types";
import { Cover } from "./cover";

type SortKey = "rating" | "light" | "quick" | "name";
const SORTS: SortKey[] = ["rating", "light", "quick", "name"];
/** 0 = any; 5 means "5 or more". */
const PLAYERS = [0, 2, 3, 4, 5];

const fitsPlayers = (g: Game, n: number) => {
  if (!n) return true;
  const min = g.values.minPlayers ?? 1, max = g.maxPlayers ?? Infinity;
  return n === 5 ? max >= 5 : min <= n && n <= max;
};

const compare: Record<SortKey, (a: Game, b: Game) => number> = {
  rating: (a, b) => (b.values.rating ?? 0) - (a.values.rating ?? 0),
  light: (a, b) => (a.values.complexity ?? 9) - (b.values.complexity ?? 9),
  quick: (a, b) => (a.values.playTime ?? 999) - (b.values.playTime ?? 999),
  name: (a, b) => a.name.localeCompare(b.name),
};

const chip = (on: boolean) =>
  `min-h-10 cursor-pointer rounded-full border px-3.5 text-sm transition-colors active:scale-[0.96] ${
    on ? "border-ink bg-ink text-paper" : "border-line bg-card text-ink hover:border-muted"
  }`;

/** The public catalogue: search, player-count and sort chips over a card grid. */
export function CatalogTable({ catalog, t, lang }: { catalog: Catalog; t: Dict; lang: Locale }) {
  const [q, setQ] = useState("");
  const [players, setPlayers] = useState(0);
  const [sort, setSort] = useState<SortKey>("rating");
  const genres = new Map(catalog.genres.map((g) => [g.id, genreName(t, g)]));
  const nf = (x: number | undefined, d = 1) => x?.toLocaleString(t.intl, { maximumFractionDigits: d }) ?? "–";

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.games
      .filter((g) => fitsPlayers(g, players) && (!needle || g.name.toLowerCase().includes(needle)
        || g.mechanics.some((m) => m.toLowerCase().includes(needle))))
      .sort(compare[sort]);
  }, [catalog.games, q, players, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.catalog.search} aria-label={t.catalog.search}
          className="min-h-11 min-w-0 flex-[1_1_260px] rounded-full border border-line bg-card px-[18px] text-[15px]" />
        <div role="group" aria-label={t.catalog.col.minPlayers} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[13px] text-muted">{t.catalog.col.minPlayers}</span>
          {PLAYERS.map((n) => (
            <button key={n} type="button" aria-pressed={players === n} onClick={() => setPlayers(n)} className={`${chip(players === n)} font-mono text-[13px]`}>
              {n === 0 ? t.catalog.all : n === 5 ? "5+" : n}
            </button>
          ))}
        </div>
      </div>
      <div className="mb-7 mt-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
        <p className="font-mono text-[13px] text-muted">{fmt(t.catalog.count, { n: rows.length })}</p>
        <div role="group" aria-label={t.catalog.sort} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[13px] text-muted">{t.catalog.sort}</span>
          {SORTS.map((k) => (
            <button key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)} className={chip(sort === k)}>{t.catalog.sorts[k]}</button>
          ))}
        </div>
      </div>

      {rows.length ? (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,230px),1fr))] gap-[22px]">
          {rows.map((g) => (
            <li key={g.id}>
              <Link href={gameHref(lang, g)}
                className="block h-full rounded-[18px] border border-line bg-card p-2.5 text-ink transition-[transform,box-shadow] duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1 hover:shadow-[0_18px_30px_-18px_rgba(31,27,22,0.45)]">
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                  <Cover name={g.name} src={g.imageUrl} fillText={56} />
                  {g.values.rating != null && (
                    <span className="tabular absolute right-2.5 top-2.5 rounded-full bg-table-gold px-2.5 py-1 font-mono text-xs font-semibold text-table-ink">
                      {nf(g.values.rating)}
                    </span>
                  )}
                </div>
                <div className="px-1.5 pb-1.5 pt-3">
                  <h2 className="font-display text-[19px] font-bold leading-tight tracking-[-0.02em]">{g.name}</h2>
                  <p className="mt-1 text-xs text-muted">{genres.get(g.genreId)} · {g.year}</p>
                  <p className="tabular mt-1.5 font-mono text-xs text-muted">
                    {g.maxPlayers && g.maxPlayers !== g.values.minPlayers ? `${g.values.minPlayers}–${g.maxPlayers}` : `${g.values.minPlayers}${g.maxPlayers ? "" : "+"}`} {t.catalog.playersUnit}
                    {" · "}{g.values.playTime}′ · {nf(g.values.complexity)}/5 · {g.values.minAge}+
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-[22px] border border-dashed border-muted/60 px-6 py-12 text-center">
          <p className="font-display text-2xl font-semibold">{t.catalog.none}</p>
          <button type="button" onClick={() => { setQ(""); setPlayers(0); }}
            className="mt-4 min-h-11 cursor-pointer rounded-full bg-ink px-5 font-semibold text-paper">{t.catalog.clear}</button>
        </div>
      )}
    </div>
  );
}
