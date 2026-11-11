"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { deleteGame, setGameRecommended } from "@/app/admin/actions";
import { DeleteButton } from "./admin-forms";
import { chip, field, panel, pillPrimary } from "./admin-ui";
import { Cover } from "./cover";

export type CatalogFilter = "notext" | "noimage" | "nobgg";

export interface CatalogRow {
  id: number;
  name: string;
  imageUrl: string | null;
  genre: string;
  linked: boolean;
  players: string;
  time: number;
  weight: number;
  age: number;
  rating: number;
  hasText: boolean;
  recommended: boolean;
}

const FILTERS: { id: CatalogFilter; label: string; test: (r: CatalogRow) => boolean }[] = [
  { id: "notext", label: "Tanpa deskripsi", test: (r) => !r.hasText },
  { id: "noimage", label: "Tanpa gambar", test: (r) => !r.imageUrl },
  { id: "nobgg", label: "Belum tertaut BGG", test: (r) => !r.linked },
];

const num = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const th = "px-2.5 py-3.5 font-medium";
const td = "px-2.5 py-2.5 font-mono text-[13px]";

export function CatalogBoard({ rows, initialFilter, live }: { rows: CatalogRow[]; initialFilter: CatalogFilter | null; live: boolean }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState(initialFilter);
  const needle = q.trim().toLowerCase();
  const test = FILTERS.find((f) => f.id === filter)?.test;
  const shown = rows.filter((r) => (!needle || r.name.toLowerCase().includes(needle)) && (!test || test(r)));
  const off = rows.filter((r) => !r.recommended).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari game…" aria-label="Cari game"
          className={`${field} flex-[1_1_240px] rounded-full! bg-card px-4`} />
        {FILTERS.map((f) => (
          <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(filter === f.id ? null : f.id)} className={`${chip(filter === f.id)} min-h-11`}>{f.label}</button>
        ))}
        <Link href="/admin/games/new" className={`${pillPrimary} text-sm`}>+ Tambah game</Link>
      </div>
      <div className={`${panel} max-h-[72vh] overflow-auto`}>
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-card">
            <tr className="text-left font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
              <th className={`${th} pl-[18px]`}>Game</th><th className={th}>Genre</th><th className={th}>BGG</th><th className={th}>Pemain</th>
              <th className={th}>Waktu</th><th className={th}>Bobot</th><th className={th}>Usia</th><th className={th}>Rating</th><th className={th}>Teks</th>
              <th className={th}>Rekomendasi</th><th className={`${th} pr-[18px]`}><span className="sr-only">Hapus</span></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-2.5 pl-[18px] pr-2.5">
                  <Link href={`/admin/games/${r.id}`} className="flex items-center gap-3 hover:text-meeple">
                    <Cover name={r.name} src={r.imageUrl} size={36} />
                    <span className="grid gap-0.5"><span className="font-semibold">{r.name}</span>{!r.imageUrl && <span className="font-mono text-[11px] text-meeple">tanpa gambar</span>}</span>
                  </Link>
                </td>
                <td className="px-2.5 py-2.5 text-[13px] text-muted">{r.genre}</td>
                <td className={`${td} whitespace-nowrap ${r.linked ? "text-felt" : "text-meeple"}`}>{r.linked ? "✓ tertaut" : "–"}</td>
                <td className={td}>{r.players}</td>
                <td className={td}>{r.time}′</td>
                <td className={td}>{num(r.weight)}</td>
                <td className={td}>{r.age}+</td>
                <td className={td}>{num(r.rating)}</td>
                <td className="px-2.5 py-2.5">
                  <span className={`rounded-md px-[7px] py-0.5 font-mono text-[11px] font-semibold ${r.hasText ? "bg-felt-soft text-felt" : "bg-meeple-soft text-meeple"}`}>{r.hasText ? "Ada" : "Kosong"}</span>
                </td>
                <td className="px-2.5 py-2.5"><Switch id={r.id} name={r.name} on={r.recommended} disabled={!live} /></td>
                <td className="py-2.5 pl-2.5 pr-[18px] text-right"><DeleteButton action={deleteGame} id={r.id} name={r.name} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!shown.length && <p className="p-6 text-center text-muted">Tidak ada game yang cocok.</p>}
      </div>
      <p className="text-[13px] text-muted">{shown.length} dari {rows.length} game ditampilkan · {off} dikeluarkan dari rekomendasi · data dari BoardGameGeek</p>
    </>
  );
}

function Switch({ id, name, on, disabled }: { id: number; name: string; on: boolean; disabled: boolean }) {
  const [shown, setShown] = useOptimistic(on);
  const [, start] = useTransition();
  return (
    <button type="button" role="switch" aria-checked={shown} disabled={disabled}
      aria-label={`${name} masuk rekomendasi`}
      onClick={() => start(async () => { setShown(!shown); await setGameRecommended(id, !shown); })}
      className={`relative h-[26px] w-11 rounded-full transition-colors disabled:opacity-50 ${shown ? "bg-table" : "bg-muted/40"}`}>
      <span className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition-transform duration-200 ${shown ? "translate-x-[18px]" : ""}`} />
    </button>
  );
}
