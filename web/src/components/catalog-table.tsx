"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmt, type Dict, type Locale } from "@/i18n";
import { genreName } from "@/lib/format";
import { gameHref } from "@/lib/i18n-paths";
import type { Catalog, Game } from "@/lib/types";
import { Cover } from "./cover";

type SortKey = "name" | "year" | "rating" | "complexity" | "playTime" | "minAge" | "minPlayers";
const COLUMNS: { key: SortKey; numeric?: boolean }[] = [
  { key: "name" }, { key: "year", numeric: true }, { key: "rating", numeric: true }, { key: "complexity", numeric: true },
  { key: "playTime", numeric: true }, { key: "minPlayers", numeric: true }, { key: "minAge", numeric: true },
];

const valueOf = (g: Game, k: SortKey) => (k === "name" ? g.name : k === "year" ? g.year : g.values[k]);

export function CatalogTable({ catalog, t, lang }: { catalog: Catalog; t: Dict; lang: Locale }) {
  const [q, setQ] = useState("");
  const [genre, setGenre] = useState<number | "all">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "rating", dir: -1 });
  const genres = new Map(catalog.genres.map((g) => [g.id, genreName(t, g)]));
  const num = (x: number | undefined) => x?.toLocaleString(t.intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.games
      .filter((g) => (genre === "all" || g.genreId === genre) && (!needle || g.name.toLowerCase().includes(needle)
        || g.mechanics.some((m) => m.toLowerCase().includes(needle))))
      .sort((a, b) => {
        const x = valueOf(a, sort.key), y = valueOf(b, sort.key);
        return (typeof x === "string" ? x.localeCompare(String(y)) : (x ?? 0) - (Number(y) || 0)) * sort.dir;
      });
  }, [catalog.games, q, genre, sort]);

  return (
    <div className="mt-6 space-y-3">
      <div className="flex flex-wrap gap-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.catalog.search}
          aria-label={t.catalog.search} className="min-w-0 flex-1 rounded-lg border border-line bg-card px-3 py-2 text-sm sm:max-w-xs" />
        <select value={genre} onChange={(e) => setGenre(e.target.value === "all" ? "all" : Number(e.target.value))}
          aria-label={t.rec.genres} className="rounded-lg border border-line bg-card px-3 py-2 text-sm">
          <option value="all">{t.catalog.allGenres}</option>
          {catalog.genres.map((g) => <option key={g.id} value={g.id}>{genres.get(g.id)}</option>)}
        </select>
        <span className="self-center text-sm text-muted">{fmt(t.catalog.shown, { n: rows.length })}</span>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs text-muted">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key} className={`px-3 py-2 font-medium ${c.numeric ? "text-right" : ""}`}
                  aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" className="hover:text-ink"
                    onClick={() => setSort((s) => ({ key: c.key, dir: s.key === c.key ? (s.dir === 1 ? -1 : 1) : c.numeric ? -1 : 1 }))}>
                    {t.catalog.col[c.key]}{sort.key === c.key ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line tabular">
            {rows.map((g) => (
              <tr key={g.id} className="hover:bg-sunken/50">
                <td className="px-3 py-2">
                  <div className="flex items-center gap-3">
                    <Cover name={g.name} src={g.imageUrl} size={36} />
                    <div className="min-w-0">
                      <Link href={gameHref(lang, g)} className="font-medium hover:underline">{g.name}</Link>
                      <div className="text-xs text-muted">{genres.get(g.genreId)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2 text-right">{g.year}</td>
                <td className="px-3 py-2 text-right">{num(g.values.rating)}</td>
                <td className="px-3 py-2 text-right">{num(g.values.complexity)}</td>
                <td className="px-3 py-2 text-right">{g.values.playTime}m</td>
                <td className="px-3 py-2 text-right">{g.maxPlayers ? `${g.values.minPlayers}–${g.maxPlayers}` : `${g.values.minPlayers}+`}</td>
                <td className="px-3 py-2 text-right">{g.values.minAge}+</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
