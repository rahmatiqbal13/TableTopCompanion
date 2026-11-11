"use client";

import { useMemo, useState, useTransition } from "react";
import { savePresetWeights } from "@/app/admin/actions";
import { DERIVED, PRESETS, TASTE, defaultPreferences, recommend, type CriterionPref, type Preset } from "@/lib/recommend";
import type { Catalog } from "@/lib/types";
import { chip, h2, panel, pillGhost, pillPrimary } from "./admin-ui";

type Weights = Record<string, number>;
type Dict = Record<string, { label: string; description: string } | undefined>;
type Names = Record<string, { name: string; hint: string } | undefined>;

const MOODS = PRESETS.filter((p) => p.id !== "balanced");
const SAMPLE = { groupSize: 4, maxTime: 45, youngestAge: 10 };

const published = (p: Preset, catalog: Catalog) => p.criteria(catalog.criteria, catalog.presetWeights?.[p.id]);
/** Taste needs a visitor's favourites, so there is nothing to tune or preview here. */
const tunable = (criteria: Record<string, CriterionPref>) => Object.keys(criteria).filter((k) => k !== TASTE);
const toWeights = (criteria: Record<string, CriterionPref>): Weights =>
  Object.fromEntries(tunable(criteria).map((k) => [k, criteria[k].importance]));

function ranking(catalog: Catalog, base: Record<string, CriterionPref>, weights: Weights) {
  const criteria = Object.fromEntries(Object.entries(base).map(([k, v]) => [k, { ...v, importance: weights[k] ?? v.importance }]));
  return recommend(catalog, { ...defaultPreferences(catalog), ...SAMPLE, diversify: false, criteria }).items;
}

const DIRECTION = (c: CriterionPref) =>
  c.type === "benefit" ? "lebih tinggi lebih baik" : c.type === "cost" ? "lebih rendah lebih baik" : `mendekati ${c.target}`;

export function WeightTuner({ catalog, presets, names }: { catalog: Catalog; presets: Dict; names: Names }) {
  const [moodId, setMoodId] = useState(MOODS[0].id);
  const [drafts, setDrafts] = useState<Record<string, Weights>>({});
  const [message, setMessage] = useState<{ error?: string; ok?: string }>({});
  const [pending, start] = useTransition();

  const mood = MOODS.find((p) => p.id === moodId)!;
  const base = useMemo(() => published(mood, catalog), [mood, catalog]);
  const live = useMemo(() => toWeights(base), [base]);
  const draft = drafts[moodId] ?? live;
  const dirty = Object.keys(live).some((k) => live[k] !== draft[k]);

  const preview = useMemo(() => ranking(catalog, base, draft), [catalog, base, draft]);
  const liveOrder = useMemo(() => ranking(catalog, base, live).map((r) => r.game.id), [catalog, base, live]);

  const keys = tunable(base);
  const pctOf = (w: Weights, k: string) => {
    const sum = keys.reduce((a, x) => a + (w[x] ?? 0), 0);
    return sum ? Math.round(((w[k] ?? 0) / sum) * 100) : 0;
  };
  const nameOf = (k: string) => names[k]?.name ?? [...catalog.criteria, ...DERIVED].find((c) => c.key === k)?.name ?? k;

  const setWeight = (k: string, value: number) => {
    setMessage({});
    setDrafts((d) => ({ ...d, [moodId]: { ...draft, [k]: value } }));
  };
  const publish = () => start(async () => setMessage(await savePresetWeights(moodId, draft)));

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {MOODS.map((p) => (
          <button key={p.id} type="button" aria-pressed={p.id === moodId} title={presets[p.id]?.description} onClick={() => { setMoodId(p.id); setMessage({}); }} className={chip(p.id === moodId)}>
            {presets[p.id]?.label ?? p.label}
          </button>
        ))}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className={`${panel} grid gap-[18px] p-[22px]`}>
          <div>
            <h2 className={h2}>Bobot kriteria</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">Bobot dinormalisasi jadi 100%.</p>
          </div>
          {keys.map((k) => {
            const now = pctOf(draft, k), delta = now - pctOf(live, k);
            return (
              <div key={k} className="grid gap-2">
                <div className="flex items-baseline justify-between gap-2.5 text-[15px]">
                  <span><span className="block font-semibold">{nameOf(k)}</span><span className="mt-0.5 block font-mono text-xs text-muted">{DIRECTION(base[k])}</span></span>
                  <span className="font-mono font-semibold tabular">{now}% {delta !== 0 && <span className={`font-normal ${delta > 0 ? "text-felt" : "text-meeple"}`}>{delta > 0 ? "+" : ""}{delta}</span>}</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={draft[k] ?? 0} aria-label={nameOf(k)} onChange={(e) => setWeight(k, Number(e.target.value))} className="min-h-7 w-full" />
              </div>
            );
          })}
          <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3.5">
            <button type="button" onClick={publish} disabled={!dirty || pending || !catalog.live} className={pillPrimary}>
              {pending ? "Menayangkan…" : dirty ? "Tayangkan bobot" : "Sudah tayang"}
            </button>
            <button type="button" onClick={() => { setDrafts((d) => ({ ...d, [moodId]: live })); setMessage({}); }} disabled={!dirty} className={pillGhost}>Kembalikan</button>
            {message.error && <span role="alert" className="text-sm text-meeple">{message.error}</span>}
            {!catalog.live && <span className="text-sm text-muted">Hanya baca tanpa database.</span>}
          </div>
        </section>

        <section className="table-surface grid gap-3.5 rounded-[18px] p-[22px] text-on-table">
          <div className="flex flex-wrap items-baseline justify-between gap-2.5">
            <h2 className={h2}>Pratinjau hasil</h2>
            <span className="font-mono text-xs text-on-table-muted">{SAMPLE.groupSize} pemain · {SAMPLE.maxTime}′ · {SAMPLE.youngestAge}+</span>
          </div>
          {preview.slice(0, 5).map((r, i) => {
            const was = liveOrder.indexOf(r.game.id);
            const move = was < 0 ? 0 : was - i;
            return (
              <div key={r.game.id} className="grid grid-cols-[28px_1fr_auto_auto] items-center gap-3 rounded-xl bg-black/20 px-3 py-2.5">
                <span className="font-display text-xl font-extrabold text-table-gold">{i + 1}</span>
                <span className="min-w-0 truncate text-[15px] font-semibold">{r.game.name}</span>
                <span className={`font-mono text-xs ${move > 0 ? "text-[#8fd1ae]" : move < 0 ? "text-[#f0875a]" : "text-[#8fae9e]"}`}>{move > 0 ? `↑${move}` : move < 0 ? `↓${-move}` : "–"}</span>
                <span className="font-mono text-sm font-semibold">{Math.round(r.score * 100)}%</span>
              </div>
            );
          })}
          {!preview.length && <p className="text-on-table-muted">Tidak ada game yang cocok untuk contoh ini.</p>}
          <p className="mt-1 text-[13px] leading-normal text-on-table-muted">Panah menunjukkan perubahan peringkat dibanding bobot yang sedang tayang.</p>
        </section>
      </div>
    </>
  );
}
