"use client";

import { useEffect, useState } from "react";
import { sendFeedback } from "@/app/actions";
import type { Dict, Locale } from "@/i18n";
import type { Recommendation } from "@/lib/recommend";

export type Vote = 1 | -1;

/** Anonymous per-browser id and votes, kept in localStorage. Shared by the home table and /recommend. */
export function useVotes() {
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

const UP = "M2 21h4V9H2v12Zm20-11a2 2 0 0 0-2-2h-6.3l1-4.6v-.3a1.5 1.5 0 0 0-.4-1L13.2 1 6.6 7.6A2 2 0 0 0 6 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.8-1.2l3-7.1c.1-.2.2-.5.2-.7v-2Z";
const DOWN = "M22 3h-4v12h4V3ZM2 14a2 2 0 0 0 2 2h6.3l-1 4.6v.3c0 .4.2.8.4 1l1.1 1.1 6.6-6.6A2 2 0 0 0 18 15V5a2 2 0 0 0-2-2H7a2 2 0 0 0-1.8 1.2l-3 7.1L2 12v2Z";

/** 👍/👎 on one recommendation. `table` is the variant that sits on the felt. */
export function FeedbackButtons({ t, vote, onVote, tone = "paper" }: {
  t: Dict; vote: Vote | undefined; onVote: (v: Vote) => void; tone?: "paper" | "table";
}) {
  if (tone === "table") {
    const pill = (v: Vote, label: string, path: string) => (
      <button type="button" aria-pressed={vote === v} onClick={() => onVote(v)}
        className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors active:scale-[0.96] ${
          vote === v ? "border-table-gold bg-table-gold text-table-ink" : "border-on-table/30 bg-black/15 text-on-table hover:bg-on-table/15"
        }`}>
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden><path fill="currentColor" d={path} /></svg>
        {label}
      </button>
    );
    return (
      <div className="mt-3.5 flex min-h-9 flex-wrap items-center gap-2 text-[13px] text-on-table-muted">
        <span aria-live="polite" className={vote ? "text-table-gold" : undefined}>{vote ? `✓ ${t.rec.feedbackThanks}` : t.rec.feedbackQ}</span>
        {pill(1, t.rec.feedbackUp, UP)}
        {pill(-1, t.rec.feedbackDown, DOWN)}
      </div>
    );
  }
  const btn = (v: Vote, label: string, path: string) => (
    <button type="button" aria-pressed={vote === v} aria-label={label} title={label} onClick={() => onVote(v)}
      className={`grid size-8 place-items-center rounded-lg border transition-colors ${
        vote === v ? (v === 1 ? "border-felt bg-felt text-on-felt" : "border-meeple bg-meeple text-paper") : "border-line text-muted hover:text-ink"
      }`}>
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden><path fill="currentColor" d={path} /></svg>
    </button>
  );
  return (
    <div className="mt-3 flex items-center gap-2 text-xs text-muted">
      <span>{vote ? t.rec.feedbackThanks : t.rec.feedbackQ}</span>
      {btn(1, t.rec.feedbackUp, UP)}
      {btn(-1, t.rec.feedbackDown, DOWN)}
    </div>
  );
}
