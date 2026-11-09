"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { getMyGame, updateMyGame, type MyGame } from "@/app/account-actions";
import { supabaseBrowser } from "@/lib/supabase/browser";

export interface GameUserLabels {
  title: string; hint: string; clear: string; played: string; own: string; wishlist: string;
  signInToRate: string; banned: string; failed: string; rateN: string; loginHref: string;
}

/** Your rating (1–10) and Played / Own / Wishlist for one game. */
export function GameUserPanel({ gameId, labels: l }: { gameId: number; labels: GameUserLabels }) {
  const sb = supabaseBrowser();
  const path = usePathname() ?? "/";
  const [state, setState] = useState<MyGame | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [, start] = useTransition();

  useEffect(() => {
    if (!sb) return;
    let alive = true;
    sb.auth.getSession().then(async ({ data }) => {
      const s = data.session ? await getMyGame(gameId) : null;
      if (alive) setState(s);
    });
    return () => { alive = false; };
  }, [sb, gameId]);

  if (!sb) return null;
  const box = "rounded-2xl border border-line bg-card p-5";
  if (state === undefined) return <div className={`${box} h-40 animate-pulse`} aria-hidden />;
  if (state === null) {
    return (
      <div className={box}>
        <h2 className="font-display text-lg font-semibold">{l.title}</h2>
        <Link href={`${l.loginHref}?next=${encodeURIComponent(path)}`}
          className="mt-3 block rounded-xl bg-felt px-4 py-2.5 text-center text-sm font-medium text-on-felt hover:opacity-90">
          {l.signInToRate}
        </Link>
      </div>
    );
  }

  const change = (patch: Partial<MyGame>) => {
    const previous = state;
    const optimistic = { ...state, ...patch, ...(patch.rating != null ? { played: true } : {}) };
    setState(optimistic);
    setError(null);
    start(async () => {
      const r = await updateMyGame(gameId, patch);
      if (r.ok && r.state) setState(r.state);
      else { setState(previous); setError(r.error === "banned" ? l.banned : l.failed); }
    });
  };
  const toggle = (key: "played" | "own" | "wishlist", label: string) => (
    <button type="button" aria-pressed={state[key]} onClick={() => change({ [key]: !state[key] })}
      className={`rounded-full border px-3 py-1 text-sm ${state[key] ? "border-felt bg-felt text-on-felt" : "border-line bg-paper hover:border-muted"}`}>
      {state[key] ? "✓ " : ""}{label}
    </button>
  );

  return (
    <div className={box}>
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold">{l.title}</h2>
        {state.rating !== null && (
          <button type="button" onClick={() => change({ rating: null })} className="text-xs text-muted underline">{l.clear}</button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted">{l.hint}</p>
      <div role="group" aria-label={l.title} className="mt-3 grid grid-cols-10 gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button key={n} type="button" aria-pressed={state.rating === n} aria-label={l.rateN.replace("{n}", String(n))}
            onClick={() => change({ rating: state.rating === n ? null : n })}
            className={`aspect-square rounded-md text-sm font-medium tabular ${
              state.rating !== null && n <= state.rating ? "bg-felt text-on-felt" : "bg-sunken text-muted hover:text-ink"
            }`}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {toggle("played", l.played)}
        {toggle("own", l.own)}
        {toggle("wishlist", l.wishlist)}
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-meeple">{error}</p>}
    </div>
  );
}
