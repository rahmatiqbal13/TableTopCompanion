import { connection } from "next/server";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin-forms";
import { isAdmin } from "@/lib/auth";
import { getFeedbackStats, type FeedbackStats } from "@/lib/data";

export default function FeedbackPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Stats />
      </Suspense>
    </div>
  );
}

const pct = (up: number, total: number) => (total ? `${Math.round((up / total) * 100)}%` : "–");

async function Stats() {
  await connection();
  if (!(await isAdmin())) return <LoginForm />;
  const s = await getFeedbackStats();
  const card = "rounded-2xl border border-line bg-card p-5";
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Feedback</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Anonymous 👍/👎 from visitors on recommended games. Use it to check that the ranking works:
          the top positions and higher match scores should get a higher “good pick” rate.
        </p>
      </div>
      {!s ? (
        <p className={card}>Connect a database (DATABASE_URL) to collect feedback.</p>
      ) : !s.total ? (
        <p className={`${card} text-muted`}>No feedback yet. It appears here as visitors use the recommender.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Metric label="Votes" value={String(s.total)} />
            <Metric label="Good pick rate" value={pct(s.up, s.total)} />
            <Metric label="Top-3 good pick rate" value={pct(s.byRank[0]?.bucket === "1–3" ? s.byRank[0].up : 0, s.byRank[0]?.bucket === "1–3" ? s.byRank[0].total : 0)} />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Buckets className={card} title="By position in the list" hint="Should fall from top to bottom." rows={s.byRank} />
            <Buckets className={card} title="By match score" hint="Should fall as the score drops. If not, the score is misleading." rows={s.byScore} />
          </div>
          <GameTable className={card} games={s.games} />
          <Recent className={card} rows={s.recent} />
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular">{value}</p>
    </div>
  );
}

function Buckets({ title, hint, rows, className }: { title: string; hint: string; rows: FeedbackStats["byRank"]; className: string }) {
  return (
    <section className={className}>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="text-xs text-muted">{hint}</p>
      <ul className="mt-4 space-y-3">
        {rows.map((r) => (
          <li key={r.bucket} className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3 text-sm">
            <span className="tabular">{r.bucket}</span>
            <span className="h-2 overflow-hidden rounded-full bg-meeple-soft" aria-hidden>
              <span className="block h-full rounded-full bg-felt" style={{ width: pct(r.up, r.total) }} />
            </span>
            <span className="text-right tabular">{pct(r.up, r.total)} <span className="text-muted">of {r.total}</span></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function GameTable({ games, className }: { games: FeedbackStats["games"]; className: string }) {
  return (
    <section className={className}>
      <h2 className="font-display text-lg font-semibold">Most voted games</h2>
      <p className="text-xs text-muted">Many 👎 on a game that ranks high often means its data (time, weight, age) needs checking.</p>
      <table className="mt-3 w-full text-sm">
        <thead className="text-left text-xs text-muted"><tr><th className="py-1">Game</th><th className="text-right">👍</th><th className="text-right">👎</th><th className="text-right">Good pick rate</th></tr></thead>
        <tbody className="divide-y divide-line tabular">
          {games.map((g) => (
            <tr key={g.id}>
              <td className="py-1.5"><a className="hover:underline" href={`/admin/games/${g.id}`}>{g.name}</a></td>
              <td className="text-right">{g.up}</td>
              <td className="text-right">{g.down}</td>
              <td className="text-right">{pct(g.up, g.up + g.down)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Recent({ rows, className }: { rows: FeedbackStats["recent"]; className: string }) {
  return (
    <section className={className}>
      <h2 className="font-display text-lg font-semibold">Latest votes</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted"><tr><th className="py-1">When</th><th>Game</th><th>Vote</th><th className="text-right">Position</th><th className="text-right">Match</th><th /></tr></thead>
          <tbody className="divide-y divide-line tabular">
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="whitespace-nowrap py-1.5 pr-3 text-muted">{r.createdAt.slice(0, 16).replace("T", " ")}</td>
                <td className="pr-3">{r.game}</td>
                <td>{r.vote === 1 ? "👍" : "👎"}</td>
                <td className="text-right">{r.rank}</td>
                <td className="text-right">{Math.round(r.score * 100)}%</td>
                <td className="pl-3 text-right"><a className="text-xs underline" href={`/${r.lang}/recommend${r.query ? `?${r.query}` : ""}`} target="_blank">Open search</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
