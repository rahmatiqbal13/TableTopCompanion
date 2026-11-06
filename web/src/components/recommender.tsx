"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { sendFeedback } from "@/app/actions";
import { fmt, type Dict, type Locale } from "@/i18n";
import { criterionHint, criterionName, genreName, reasonText } from "@/lib/format";
import { gameHref } from "@/lib/i18n-paths";
import {
  DERIVED, PLAYER_FIT, PRESETS, TASTE, defaultPreferences, explain, fromSearchParams, recommend,
  toSearchParams, type CriterionPref, type Preferences, type Recommendation, type RecommendationResult,
} from "@/lib/recommend";
import type { Catalog, Criterion, CriterionType, Game } from "@/lib/types";
import { Cover } from "./cover";
import { Chip, Field, Panel } from "./ui";

const PAGE = 10;

interface Ctx {
  catalog: Catalog;
  t: Dict;
  lang: Locale;
}

export function Recommender({ catalog, t, lang }: Ctx) {
  const params = useSearchParams();
  const [prefs, setPrefs] = useState<Preferences>(() => fromSearchParams(new URLSearchParams(params), catalog));
  const deferred = useDeferredValue(prefs);
  const result = useMemo(() => recommend(catalog, deferred), [catalog, deferred]);
  const [shown, setShown] = useState(PAGE);
  const ctx = { catalog, t, lang };
  const votes = useVotes();
  const query = useMemo(() => toSearchParams(deferred, catalog).toString(), [deferred, catalog]);

  // Keep the URL in sync so a result can be shared or bookmarked.
  useEffect(() => {
    const timer = setTimeout(() => {
      const qs = toSearchParams(prefs, catalog).toString();
      window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
    }, 250);
    return () => clearTimeout(timer);
  }, [prefs, catalog]);

  const update = (patch: Partial<Preferences>) => {
    setPrefs((p) => ({ ...p, ...patch }));
    setShown(PAGE);
  };
  const setCriterion = (key: string, patch: Partial<CriterionPref>) =>
    setPrefs((p) => ({ ...p, criteria: { ...p.criteria, [key]: { ...p.criteria[key], ...patch } } }));

  return (
    <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 pb-16 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <aside className="min-w-0 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pr-1">
        <a href="#results" className="block rounded-xl bg-felt py-2.5 text-center text-sm font-medium text-on-felt lg:hidden">
          {fmt(t.rec.seeResults, { n: result.candidates.length })}
        </a>
        <TonightPanel {...ctx} prefs={prefs} update={update} />
        <PriorityPanel {...ctx} prefs={prefs} setPrefs={setPrefs} setCriterion={setCriterion} update={update} />
      </aside>
      <section id="results" aria-live="polite" className="min-w-0 scroll-mt-4 space-y-4">
        <Summary {...ctx} result={result} prefs={deferred} update={update} />
        <ol className="space-y-3">
          {result.items.slice(0, shown).map((rec) => (
            <ResultCard key={rec.game.id} {...ctx} rec={rec} result={result} prefs={deferred}
              feedback={catalog.live ? { vote: votes.get(rec.game.id), onVote: (v) => votes.cast(rec, v, query, lang) } : null} />
          ))}
        </ol>
        {result.items.length > shown && (
          <button onClick={() => setShown((s) => s + PAGE)}
            className="w-full rounded-xl border border-line bg-card py-2.5 text-sm font-medium hover:bg-sunken">
            {fmt(t.rec.showMore, { n: Math.min(PAGE, result.items.length - shown) })}
          </button>
        )}
        {result.topsis && <MathPanel t={t} result={result} prefs={deferred} />}
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left column
// ---------------------------------------------------------------------------

function TonightPanel({ catalog, t, prefs, update }: Ctx & { prefs: Preferences; update: (p: Partial<Preferences>) => void }) {
  const years = catalog.games.map((g) => g.year);
  const [minYear, maxYear] = [Math.min(...years), Math.max(...years)];
  return (
    <Panel title={t.rec.tonight}>
      <Field label={t.rec.players} hint={prefs.groupSize === null ? t.rec.playersAny : t.rec.playersHint}>
        <div className="flex items-center gap-2">
          <button type="button" aria-label={t.rec.fewer} onClick={() => update({ groupSize: Math.max(1, (prefs.groupSize ?? 2) - 1) })}
            className="size-9 rounded-lg border border-line text-lg hover:bg-sunken">−</button>
          <span className="w-10 text-center font-display text-xl tabular">{prefs.groupSize ?? "–"}</span>
          <button type="button" aria-label={t.rec.more} onClick={() => update({ groupSize: Math.min(20, (prefs.groupSize ?? 1) + 1) })}
            className="size-9 rounded-lg border border-line text-lg hover:bg-sunken">+</button>
          {prefs.groupSize !== null && (
            <button type="button" onClick={() => update({ groupSize: null })} className="ml-auto text-xs text-muted underline">{t.rec.any}</button>
          )}
        </div>
      </Field>
      <Field label={t.rec.youngest}>
        <div className="flex flex-wrap gap-1.5">
          {[null, 6, 8, 10, 12, 14].map((a) => (
            <Chip key={a ?? "any"} active={prefs.youngestAge === a} onClick={() => update({ youngestAge: a })}>
              {a === null ? t.rec.any : `${a}`}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label={t.rec.time}>
        <div className="flex flex-wrap gap-1.5">
          {[null, 30, 60, 90, 120, 180].map((m) => (
            <Chip key={m ?? "any"} active={prefs.maxTime === m} onClick={() => update({ maxTime: m })}>
              {m === null ? t.rec.any : m < 60 ? `${m}m` : `${(m / 60).toLocaleString(t.intl)}h`}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label={t.rec.genres} hint={prefs.genres.length ? fmt(t.rec.genresSelected, { n: prefs.genres.length }) : t.rec.genresAll}>
        <div className="flex flex-wrap gap-1.5">
          {catalog.genres.map((g) => (
            <Chip key={g.id} active={prefs.genres.includes(g.id)}
              onClick={() => update({ genres: prefs.genres.includes(g.id) ? prefs.genres.filter((x) => x !== g.id) : [...prefs.genres, g.id] })}>
              {genreName(t, g).replace(/ Game$/, "")}
            </Chip>
          ))}
        </div>
      </Field>
      <Field label={t.rec.released}>
        <div className="flex items-center gap-2 text-sm">
          <YearInput value={prefs.yearFrom} placeholder={minYear} onChange={(v) => update({ yearFrom: v })} label={t.rec.fromYear} />
          <span className="text-muted">{t.rec.to}</span>
          <YearInput value={prefs.yearTo} placeholder={maxYear} onChange={(v) => update({ yearTo: v })} label={t.rec.toYear} />
        </div>
      </Field>
    </Panel>
  );
}

function YearInput({ value, placeholder, onChange, label }: { value: number | null; placeholder: number; onChange: (v: number | null) => void; label: string }) {
  return (
    <input type="number" inputMode="numeric" aria-label={label} placeholder={String(placeholder)} value={value ?? ""}
      onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
      className="w-24 rounded-lg border border-line bg-paper px-2.5 py-1.5 tabular" />
  );
}

function samePrefs(a: Record<string, CriterionPref>, b: Record<string, CriterionPref>) {
  return Object.keys(b).every((k) => a[k]?.importance === b[k].importance && a[k]?.type === b[k].type && a[k]?.target === b[k].target);
}

function PriorityPanel({ catalog, t, lang, prefs, setPrefs, setCriterion, update }: Ctx & {
  prefs: Preferences;
  setPrefs: React.Dispatch<React.SetStateAction<Preferences>>;
  setCriterion: (key: string, patch: Partial<CriterionPref>) => void;
  update: (p: Partial<Preferences>) => void;
}) {
  return (
    <Panel title={t.rec.matters}
      action={<button type="button" onClick={() => setPrefs(defaultPreferences(catalog))} className="text-xs text-muted underline">{t.rec.resetAll}</button>}>
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const values = p.criteria(catalog.criteria);
          // Presets leave the derived criteria at the user's current setting.
          for (const d of DERIVED) values[d.key] = prefs.criteria[d.key];
          const label = t.presets[p.id] ?? { label: p.label, description: p.description };
          return (
            <Chip key={p.id} title={label.description} active={samePrefs(prefs.criteria, values)}
              onClick={() => setPrefs((s) => ({ ...s, criteria: values }))}>
              {label.label}
            </Chip>
          );
        })}
      </div>
      <FavouritePicker catalog={catalog} t={t} lang={lang} prefs={prefs} update={update} />
      <div className="divide-y divide-line">
        {[...catalog.criteria, ...DERIVED].map((c) => {
          const inactive =
            c.key === PLAYER_FIT && prefs.groupSize === null ? t.rec.needPlayers :
            c.key === TASTE && !prefs.favourites.length ? t.rec.needFavourite : null;
          return (
            <CriterionRow key={c.key} criterion={c} pref={prefs.criteria[c.key]} inactive={inactive} t={t}
              derived={c.id < 0} onChange={(patch) => setCriterion(c.key, patch)} catalog={catalog} />
          );
        })}
      </div>
      <label className="flex items-start gap-2.5 text-sm">
        <input type="checkbox" checked={prefs.diversify} onChange={(e) => update({ diversify: e.target.checked })} className="mt-0.5 accent-[var(--felt)]" />
        <span><span className="font-medium">{t.rec.mix}</span>
          <span className="block text-xs text-muted">{t.rec.mixHint}</span></span>
      </label>
    </Panel>
  );
}

function CriterionRow({ criterion: c, pref, onChange, inactive, derived, catalog, t }: {
  criterion: Criterion; pref: CriterionPref; onChange: (p: Partial<CriterionPref>) => void;
  inactive: string | null; derived: boolean; catalog: Catalog; t: Dict;
}) {
  const median = useMemo(() => {
    const xs = catalog.games.map((g) => g.values[c.key]).filter(Number.isFinite).sort((a, b) => a - b);
    return xs.length ? xs[Math.floor(xs.length / 2)] : 0;
  }, [catalog, c.key]);
  const name = criterionName(t, c);
  const directions: { type: CriterionType; label: string; title: string }[] = [
    { type: "benefit", label: t.rec.dirMore, title: t.rec.dirMoreTitle },
    { type: "cost", label: t.rec.dirLess, title: t.rec.dirLessTitle },
    { type: "target", label: t.rec.dirAround, title: t.rec.dirAroundTitle },
  ];
  const id = `imp-${c.key}`;
  return (
    <div className={`py-3 ${inactive ? "opacity-60" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium" title={criterionHint(t, c)}>{name}</label>
        <span className="text-xs tabular text-muted">{pref.importance === 0 ? t.rec.off : `${pref.importance} / 10`}</span>
      </div>
      <input id={id} type="range" min={0} max={10} step={1} value={pref.importance}
        onChange={(e) => onChange({ importance: Number(e.target.value) })} className="mt-1 w-full" />
      {inactive ? (
        <p className="text-xs text-muted">{inactive}</p>
      ) : !derived && pref.importance > 0 ? (
        <div className="mt-1 flex items-center gap-2">
          <div role="group" aria-label={fmt(t.rec.direction, { name })} className="inline-flex rounded-lg border border-line p-0.5 text-xs">
            {directions.map((d) => (
              <button key={d.type} type="button" title={d.title} aria-pressed={pref.type === d.type}
                onClick={() => onChange({ type: d.type, target: d.type === "target" ? (pref.target ?? median) : undefined })}
                className={`rounded-md px-2.5 py-1 ${pref.type === d.type ? "bg-felt text-on-felt" : "text-muted hover:text-ink"}`}>
                {d.label}
              </button>
            ))}
          </div>
          {pref.type === "target" && (
            <input type="number" aria-label={fmt(t.rec.target, { name })} value={pref.target ?? ""} step="any"
              onChange={(e) => onChange({ target: Number(e.target.value) })}
              className="w-20 rounded-lg border border-line bg-paper px-2 py-1 text-xs tabular" />
          )}
        </div>
      ) : null}
    </div>
  );
}

function FavouritePicker({ catalog, t, prefs, update }: Ctx & { prefs: Preferences; update: (p: Partial<Preferences>) => void }) {
  const [q, setQ] = useState("");
  const favs = prefs.favourites.map((id) => catalog.games.find((g) => g.id === id)).filter((g): g is Game => Boolean(g));
  const matches = q.trim().length < 2 ? [] : catalog.games
    .filter((g) => !prefs.favourites.includes(g.id) && g.name.toLowerCase().includes(q.trim().toLowerCase()))
    .slice(0, 6);
  return (
    <Field label={t.rec.love} hint={t.rec.loveHint}>
      {favs.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {favs.map((g) => (
            <li key={g.id} className="flex items-center gap-1 rounded-full bg-felt-soft py-0.5 pl-3 pr-1 text-sm">
              {g.name}
              <button type="button" aria-label={fmt(t.rec.remove, { name: g.name })} onClick={() => update({ favourites: prefs.favourites.filter((x) => x !== g.id) })}
                className="grid size-5 place-items-center rounded-full hover:bg-card">×</button>
            </li>
          ))}
        </ul>
      )}
      <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.rec.loveSearch}
        disabled={favs.length >= 10} aria-label={t.rec.love}
        className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-sm" />
      {matches.length > 0 && (
        <ul className="mt-1 overflow-hidden rounded-lg border border-line bg-paper text-sm">
          {matches.map((g) => (
            <li key={g.id}>
              <button type="button" onClick={() => { update({ favourites: [...prefs.favourites, g.id] }); setQ(""); }}
                className="flex w-full justify-between gap-2 px-3 py-1.5 text-left hover:bg-sunken">
                <span className="truncate">{g.name}</span><span className="text-muted tabular">{g.year}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Field>
  );
}

// ---------------------------------------------------------------------------
// Right column
// ---------------------------------------------------------------------------

function Summary({ catalog, t, result, prefs, update }: Ctx & { result: RecommendationResult; prefs: Preferences; update: (p: Partial<Preferences>) => void }) {
  const out = Object.entries(result.excluded).filter(([, n]) => n) as [keyof Dict["rec"]["exclusion"], number][];
  if (!result.items.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line p-8 text-center">
        <p className="font-display text-lg">{result.used.length ? t.rec.noneFit : t.rec.noneActive}</p>
        {result.used.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm">
            {prefs.groupSize !== null && <Chip active={false} onClick={() => update({ groupSize: null })}>{t.rec.relaxPlayers}</Chip>}
            {prefs.maxTime !== null && <Chip active={false} onClick={() => update({ maxTime: null })}>{t.rec.relaxTime}</Chip>}
            {prefs.youngestAge !== null && <Chip active={false} onClick={() => update({ youngestAge: null })}>{t.rec.relaxAge}</Chip>}
            {prefs.genres.length > 0 && <Chip active={false} onClick={() => update({ genres: [] })}>{t.rec.relaxGenres}</Chip>}
            {(prefs.yearFrom !== null || prefs.yearTo !== null) && <Chip active={false} onClick={() => update({ yearFrom: null, yearTo: null })}>{t.rec.relaxYears}</Chip>}
          </div>
        )}
      </div>
    );
  }
  return (
    <p className="text-sm text-muted">
      {fmt(t.rec.fit, { n: result.candidates.length, total: catalog.games.length })}
      {out.length > 0 && <> · {fmt(t.rec.filteredBy, { list: out.map(([r, n]) => `${t.rec.exclusion[r]} (${n})`).join(", ") })}</>}
    </p>
  );
}

type Vote = 1 | -1;

/** Anonymous per-browser id and votes, kept in localStorage. */
function useVotes() {
  const [votes, setVotes] = useState<Record<number, Vote>>({});
  useEffect(() => {
    try {
      // Read after mount so server and client render the same markup.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVotes(JSON.parse(localStorage.getItem("ttc-votes") ?? "{}"));
    } catch { /* storage unavailable: start empty */ }
  }, []);
  const sessionId = () => {
    try {
      let id = localStorage.getItem("ttc-sid");
      if (!id) localStorage.setItem("ttc-sid", (id = crypto.randomUUID()));
      return id;
    } catch {
      return crypto.randomUUID();
    }
  };
  return {
    get: (gameId: number) => votes[gameId],
    cast(rec: Recommendation, v: Vote, query: string, lang: Locale) {
      const next = votes[rec.game.id] === v ? 0 : v;
      const updated = { ...votes };
      if (next === 0) delete updated[rec.game.id];
      else updated[rec.game.id] = next;
      setVotes(updated);
      try { localStorage.setItem("ttc-votes", JSON.stringify(updated)); } catch { /* ignore */ }
      void sendFeedback({ sessionId: sessionId(), gameId: rec.game.id, vote: next, rank: rec.rank, score: rec.score, query, lang });
    },
  };
}

function FeedbackButtons({ t, vote, onVote }: { t: Dict; vote: Vote | undefined; onVote: (v: Vote) => void }) {
  const btn = (v: Vote, label: string, path: string) => (
    <button type="button" aria-pressed={vote === v} aria-label={label} title={label} onClick={() => onVote(v)}
      className={`grid size-8 place-items-center rounded-lg border transition-colors ${
        vote === v ? (v === 1 ? "border-felt bg-felt text-on-felt" : "border-meeple bg-meeple text-paper") : "border-line text-muted hover:text-ink"
      }`}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d={path} /></svg>
    </button>
  );
  const up = "M2 21h4V9H2v12Zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3a1.5 1.5 0 0 0-.4-1L13.2 1 6.6 7.6A2 2 0 0 0 6 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2Z";
  const down = "M22 3h-4v12h4V3ZM2 14a2 2 0 0 0 2 2h6.3l-1 4.6v.3c0 .4.2.8.4 1l1.1 1.1 6.6-6.6A2 2 0 0 0 18 15V5a2 2 0 0 0-2-2H7a2 2 0 0 0-1.8 1.2l-3 7.1L2 12v2Z";
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
      <span>{vote ? t.rec.feedbackThanks : t.rec.feedbackQ}</span>
      {btn(1, t.rec.feedbackUp, up)}
      {btn(-1, t.rec.feedbackDown, down)}
    </div>
  );
}

function ResultCard({ rec, catalog, t, lang, result, prefs, feedback }: Ctx & {
  rec: Recommendation; result: RecommendationResult; prefs: Preferences;
  feedback: { vote: Vote | undefined; onVote: (v: Vote) => void } | null;
}) {
  const g = rec.game;
  const genre = genreName(t, catalog.genres.find((x) => x.id === g.genreId));
  const byKey = new Map([...catalog.criteria, ...DERIVED].map((c) => [c.key, c]));
  const reasons = explain(rec, result.used, prefs);
  const pct = Math.round(rec.score * 100);
  const v = g.values;
  const players = g.maxPlayers ? (g.maxPlayers === v.minPlayers ? `${v.minPlayers}` : `${v.minPlayers}–${g.maxPlayers}`) : `${v.minPlayers}+`;
  const top = rec.rank <= 3;
  const num = (x: number | undefined, d: number) => x?.toLocaleString(t.intl, { minimumFractionDigits: d, maximumFractionDigits: d });
  return (
    <li className={`flex gap-4 rounded-2xl border bg-card p-4 ${top ? "border-felt/40" : "border-line"}`}>
      <span className={`w-8 shrink-0 text-center font-display text-2xl font-semibold tabular ${top ? "text-felt" : "text-muted"}`}>{rec.rank}</span>
      <Cover name={g.name} src={g.imageUrl} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="font-display text-lg font-semibold leading-snug">
            <Link href={gameHref(lang, g)} className="hover:underline">{g.name}</Link>
          </h3>
          <span className="text-sm tabular" title={t.rec.matchTitle}>
            <span className="font-semibold">{pct}%</span> <span className="text-muted">{t.rec.match}</span>
          </span>
        </div>
        <p className="text-xs text-muted">{genre} · {g.year}{g.bggRank ? ` · BGG #${g.bggRank}` : ""}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
          <div className="h-full rounded-full bg-felt" style={{ width: `${pct}%` }} />
        </div>
        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <Stat label={t.rec.stat.players} value={players} />
          <Stat label={t.rec.stat.time} value={`${v.playTime}m`} />
          <Stat label={t.rec.stat.weight} value={`${num(v.complexity, 1)} / 5`} />
          <Stat label={t.rec.stat.rating} value={`${num(v.rating, 1)}${g.votes ? ` (${compact(g.votes, t.intl)})` : ""}`} />
          <Stat label={t.rec.stat.age} value={`${v.minAge}+`} />
          {g.bestPlayers.length > 0 && <Stat label={t.rec.stat.best} value={g.bestPlayers.join(", ")} />}
        </dl>
        {reasons.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1.5 text-xs">
            {reasons.map((r) => (
              <li key={r.key} className={`rounded-md px-2 py-1 text-ink ${r.tone === "good" ? "bg-felt-soft" : "bg-meeple-soft"}`}>
                <span aria-hidden className={r.tone === "good" ? "text-felt" : "text-meeple"}>{r.tone === "good" ? "▲ " : "▼ "}</span>
                {reasonText(t, r, byKey.get(r.key)!)}
              </li>
            ))}
          </ul>
        )}
        {rec.alike.length > 0 && (
          <p className="mt-2 text-xs text-muted">
            {t.rec.alike}{" "}
            {rec.alike.map((a, k) => (
              <span key={a.id}>{k > 0 && ", "}<Link href={gameHref(lang, a)} className="underline hover:text-ink">{a.name}</Link></span>
            ))}
          </p>
        )}
        {feedback && <FeedbackButtons t={t} vote={feedback.vote} onVote={feedback.onVote} />}
      </div>
    </li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-1">
      <dt>{label}</dt>
      <dd className="font-medium text-ink tabular">{value}</dd>
    </div>
  );
}

const compact = (n: number, intl: string) => new Intl.NumberFormat(intl, { notation: "compact" }).format(n);

// ---------------------------------------------------------------------------
// "Show the math": every TOPSIS step, like the original thesis tables.
// ---------------------------------------------------------------------------

type Step = "x" | "r" | "y" | "d";

function MathPanel({ t, result, prefs }: { t: Dict; result: RecommendationResult; prefs: Preferences }) {
  const [step, setStep] = useState<Step>("x");
  const [all, setAll] = useState(false);
  const tp = result.topsis!;
  // Every candidate in score order, including games folded under a look-alike.
  const rows = tp.order.slice(0, all ? undefined : 15).map((i, k) => ({ it: { game: result.candidates[i], rank: k + 1 }, i }));
  const matrix = step === "x" ? tp.decision : step === "r" ? tp.normalized : tp.weighted;
  const f = (x: number) => (step === "x" ? (Number.isInteger(x) ? String(x) : x.toFixed(3)) : x.toFixed(4));
  const notes: Record<Step, string> = { x: t.rec.steps.xNote, r: t.rec.steps.rNote, y: t.rec.steps.yNote, d: t.rec.steps.dNote };
  const dir = (key: string) => {
    const p = prefs.criteria[key];
    return p.type === "benefit" ? "max" : p.type === "cost" ? "min" : `≈${p.target}`;
  };
  return (
    <details className="group rounded-2xl border border-line bg-card">
      <summary className="cursor-pointer list-none px-4 py-3 font-display font-semibold">
        <span className="mr-2 inline-block transition-transform group-open:rotate-90">›</span>{t.rec.math}
        <span className="ml-2 font-sans text-xs font-normal text-muted">{t.rec.mathSub}</span>
      </summary>
      <div className="space-y-3 border-t border-line p-4">
        <div className="flex flex-wrap gap-1.5">
          {(["x", "r", "y", "d"] as Step[]).map((s) => (
            <Chip key={s} active={step === s} onClick={() => setStep(s)}>{t.rec.steps[s]}</Chip>
          ))}
        </div>
        <p className="text-xs text-muted">{notes[step]}</p>
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-xs tabular">
            <thead className="bg-sunken text-left">
              <tr>
                <th className="px-2 py-1.5">#</th>
                <th className="px-2 py-1.5">{t.rec.game}</th>
                {step === "d" ? (
                  <><th className="px-2 py-1.5 text-right">D⁺</th><th className="px-2 py-1.5 text-right">D⁻</th>
                    <th className="px-2 py-1.5 text-right">{t.rec.colFit}</th><th className="px-2 py-1.5 text-right">{t.rec.colPenalty}</th>
                    <th className="px-2 py-1.5 text-right">{t.rec.colScore}</th></>
                ) : result.used.map((c, j) => (
                  <th key={c.key} className="px-2 py-1.5 text-right font-medium">
                    {criterionName(t, c)}
                    <span className="block font-normal text-muted">w={tp.weights[j].toFixed(3)} · {dir(c.key)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map(({ it, i }) => (
                <tr key={it.game.id}>
                  <td className="px-2 py-1 text-muted">{it.rank}</td>
                  <td className="max-w-48 truncate px-2 py-1">{it.game.name}</td>
                  {step === "d" ? (
                    <><td className="px-2 py-1 text-right">{tp.dPlus[i].toFixed(5)}</td><td className="px-2 py-1 text-right">{tp.dMinus[i].toFixed(5)}</td>
                      <td className="px-2 py-1 text-right">{tp.fit[i].toFixed(4)}</td>
                      <td className={`px-2 py-1 text-right ${tp.penalty[i] < 1 ? "text-meeple" : "text-muted"}`}>×{tp.penalty[i].toFixed(2)}</td>
                      <td className="px-2 py-1 text-right font-semibold">{tp.scores[i].toFixed(4)}</td></>
                  ) : matrix[i].map((x, j) => <td key={j} className="px-2 py-1 text-right">{f(x)}</td>)}
                </tr>
              ))}
              {step === "y" && (
                <>
                  <tr className="bg-felt-soft"><td /><td className="px-2 py-1 font-medium">{t.rec.idealBest}</td>{tp.idealBest.map((x, j) => <td key={j} className="px-2 py-1 text-right">{x.toFixed(4)}</td>)}</tr>
                  <tr className="bg-meeple-soft"><td /><td className="px-2 py-1 font-medium">{t.rec.idealWorst}</td>{tp.idealWorst.map((x, j) => <td key={j} className="px-2 py-1 text-right">{x.toFixed(4)}</td>)}</tr>
                </>
              )}
            </tbody>
          </table>
        </div>
        {tp.order.length > 15 && (
          <button type="button" onClick={() => setAll((a) => !a)} className="text-xs text-muted underline">
            {all ? t.rec.showTop : fmt(t.rec.showAllRows, { n: tp.order.length })}
          </button>
        )}
        {prefs.diversify && <p className="text-xs text-muted">{t.rec.mixNote}</p>}
      </div>
    </details>
  );
}
