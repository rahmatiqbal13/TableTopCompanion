"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmt, type Dict, type Locale } from "@/i18n";
import { reasonText } from "@/lib/format";
import { gameHref, href } from "@/lib/i18n-paths";
import { PRESETS, defaultPreferences, explain, recommend, toSearchParams, type Preferences } from "@/lib/recommend";
import type { Catalog, Game } from "@/lib/types";
import { Cover } from "./cover";

const MOODS = ["beginner", "quick", "family", "brainburner", "toprated"] as const;
type Mood = (typeof MOODS)[number];

const TIMES = [20, 45, 90, null];
const AGES = [6, 8, 10, null];
const SEATS = [1, 2, 3, 4, 5, 6, 7, 8];
const INITIAL = { players: 4, time: 45 as number | null, age: 10 as number | null, mood: "beginner" as Mood };

/** The cards land slightly askew, like a real deal. */
const TILTS = ["-rotate-[2.5deg]", "rotate-[0.8deg] translate-y-2.5", "rotate-[2.8deg]"];

/** Home hero: a one-glance version of the recommender, on the same engine as /recommend. */
export function TonightTable({ catalog, t, lang }: { catalog: Catalog; t: Dict; lang: Locale }) {
  const [table, setTable] = useState(INITIAL);
  const { players, time, age, mood } = table;
  const set = (patch: Partial<typeof INITIAL>) => setTable((s) => ({ ...s, ...patch }));
  const h = t.home;

  const prefs: Preferences = useMemo(() => ({
    ...defaultPreferences(catalog),
    groupSize: players, maxTime: time, youngestAge: age,
    criteria: PRESETS.find((p) => p.id === mood)!.criteria(catalog.criteria),
  }), [catalog, players, time, age, mood]);
  const result = useMemo(() => recommend(catalog, prefs), [catalog, prefs]);
  const picks = result.items.slice(0, 3);
  const byKey = new Map(result.used.map((c) => [c.key, c]));
  const nf = (x: number) => x.toLocaleString(t.intl, { maximumFractionDigits: 1 });

  const stats = (g: Game) => {
    const min = g.values.minPlayers;
    const seats = g.maxPlayers === null ? `${min}+` : g.maxPlayers === min ? `${min}` : `${min}–${g.maxPlayers}`;
    return [fmt(h.playersCount, { n: seats }), `${g.values.playTime}′`, `${nf(g.values.complexity)}/5`, `${g.values.minAge}+`].join(" · ");
  };

  return (
    <section className="table-surface relative overflow-hidden text-on-table">
      <div aria-hidden className="table-vignette pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-6 pb-9 pt-10 sm:pt-14">
          <div className="max-w-[760px]">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-table-gold">{h.kicker}</p>
            <h1 className="mt-3.5 text-balance font-display text-[clamp(44px,7.4vw,96px)] font-bold leading-[0.95] tracking-[-0.045em]">{h.title}</h1>
            <p className="mt-5 max-w-[560px] text-pretty text-lg leading-relaxed text-on-table-muted">{h.subtitle}</p>
          </div>
          <div aria-live="polite">
            <div className="tabular font-display text-[64px] font-bold leading-none tracking-[-0.04em]">
              {result.candidates.length}<span className="text-[28px] text-[#8fae9e]">/{catalog.games.length}</span>
            </div>
            <p className="mt-1.5 text-sm text-on-table-muted">{h.fitLabel}</p>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-[22px] border border-on-table/15 bg-on-table/15 sm:grid-cols-2 lg:grid-cols-4">
          <Control label={<>{h.players} · <span className="font-mono text-on-table">{players}</span></>}>
            <div className="flex">
              {SEATS.map((n) => (
                <button key={n} type="button" onClick={() => set({ players: n })} aria-pressed={n === players} aria-label={fmt(h.playersCount, { n })}
                  className="grid h-11 min-w-6 flex-[0_1_30px] cursor-pointer place-items-center transition-transform duration-150 hover:-translate-y-[3px] active:scale-90">
                  <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden>
                    <path className="transition-[fill] duration-200" fill={n <= players ? "#f4efe4" : "rgba(244,239,228,0.22)"} d="M12 2a3.2 3.2 0 0 1 3.2 3.2c0 .9-.4 1.8-1 2.4 3 .5 7.3 1.6 7.3 3.8 0 1.4-2 2-4.2 2.1l2.8 6.1c.4.8-.2 1.6-1 1.6h-3.3L12 16.4 8.2 21.2H4.9c-.8 0-1.4-.8-1-1.6l2.8-6.1c-2.2-.1-4.2-.7-4.2-2.1 0-2.2 4.3-3.3 7.3-3.8-.6-.6-1-1.5-1-2.4A3.2 3.2 0 0 1 12 2Z" />
                  </svg>
                </button>
              ))}
            </div>
          </Control>
          <Control label={h.time}>
            {TIMES.map((v) => <Option key={v ?? "any"} mono active={time === v} onClick={() => set({ time: v })}>{v === null ? h.any : `${v}′`}</Option>)}
          </Control>
          <Control label={h.youngest}>
            {AGES.map((v) => <Option key={v ?? "adult"} mono active={age === v} onClick={() => set({ age: v })}>{v === null ? h.adult : `${v}+`}</Option>)}
          </Control>
          <Control label={h.mood}>
            {MOODS.map((m) => <Option key={m} active={mood === m} onClick={() => set({ mood: m })}>{h.moods[m]}</Option>)}
          </Control>
        </div>

        <div className="pb-[72px] pt-11">
          <div className="mb-[22px] flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em]">{h.dealt}</h2>
            <Link href={`${href(lang, "/recommend")}?${toSearchParams(prefs, catalog)}`} className="border-b border-on-table/35 pb-0.5 text-sm text-on-table-muted hover:text-on-table">{h.allResults}</Link>
          </div>

          {picks.length > 0 ? (
            // Re-keying on the settings re-runs the deal animation with each change.
            <div key={`${players}-${time}-${age}-${mood}`} className="grid gap-[22px] sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((rec, i) => (
                <div key={rec.game.id} className="deal-in" style={{ animationDelay: `${i * 70}ms` }}>
                  <Link href={gameHref(lang, rec.game)}
                    className={`block rounded-[18px] bg-card p-2.5 text-ink shadow-[0_24px_40px_-18px_rgba(0,0,0,0.55),0_2px_6px_rgba(0,0,0,0.2)] transition-transform duration-[260ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-1.5 hover:rotate-0 ${TILTS[i]}`}>
                    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
                      <Cover name={rec.game.name} src={rec.game.imageUrl} fillText={68} />
                      <span className="absolute left-2.5 top-2.5 rounded-full bg-black/45 px-2.5 py-1 font-mono text-[11px] tracking-[0.08em] text-white">{fmt(h.pick, { n: i + 1 })}</span>
                      <span className="absolute bottom-2.5 right-2.5 grid size-16 place-items-center rounded-full bg-table-gold text-center leading-none text-table-ink shadow-[0_6px_14px_rgba(0,0,0,0.3)]">
                        <span>
                          <span className="tabular block font-mono text-[19px] font-semibold">{Math.round(rec.score * 100)}%</span>
                          <span className="mt-0.5 block text-[10px]">{h.match}</span>
                        </span>
                      </span>
                    </div>
                    <div className="px-2 pb-2 pt-3.5">
                      <h3 className="font-display text-[22px] font-bold leading-[1.1] tracking-[-0.02em]">{rec.game.name}</h3>
                      <p className="mt-1.5 font-mono text-xs text-muted">{stats(rec.game)}</p>
                      <ul className="mt-3.5 grid gap-1.5 border-t border-dashed border-line pt-3 text-sm">
                        {explain(rec, result.used, prefs).map((r) => (
                          <li key={r.code} className="flex items-baseline gap-2">
                            <span aria-hidden className={`text-[11px] ${r.tone === "good" ? "text-felt" : "text-meeple"}`}>{r.tone === "good" ? "▲" : "▼"}</span>
                            <span>{reasonText(t, r, byKey.get(r.key)!)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-on-table/40 px-6 py-12 text-center">
              <p className="font-display text-[26px] font-semibold">{h.noneTitle}</p>
              <p className="mb-5 mt-2 text-on-table-muted">{h.noneBody}</p>
              <button type="button" onClick={() => setTable(INITIAL)} className="min-h-11 cursor-pointer rounded-full bg-on-table px-5 font-semibold text-table-ink active:scale-[0.97]">{h.reset}</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Control({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="min-w-0 bg-table p-5 shadow-[inset_0_0_0_999px_rgba(0,0,0,0.2)]">
      <p className="mb-3 text-[13px] text-on-table-muted">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Option({ active, onClick, mono, children }: { active: boolean; onClick: () => void; mono?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`min-h-11 cursor-pointer rounded-xl border px-3.5 font-medium transition-[background-color,transform] duration-150 active:scale-95 ${mono ? "font-mono text-[13px]" : "text-sm"} ${
        active ? "border-on-table bg-on-table text-table-ink" : "border-on-table/20 bg-black/15 text-on-table"
      }`}>
      {children}
    </button>
  );
}
