import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { Bar, h2, panel, pct } from "@/components/admin-ui";
import { isAdmin } from "@/lib/auth";
import { getFeedbackStats, type FeedbackStats } from "@/lib/data";

export const metadata: Metadata = { title: "Umpan balik · Admin", robots: { index: false } };

export default function FeedbackPage() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Stats />
    </Suspense>
  );
}

const headRow = "text-left font-mono text-[11px] uppercase tracking-[0.1em] text-muted";

async function Stats() {
  await connection();
  if (!(await isAdmin())) return <AdminSignIn />;
  const s = await getFeedbackStats();
  const top = s?.byRank[0]?.bucket === "1–3" ? s.byRank[0] : null;
  return (
    <>
      <AdminHeader kicker="Validasi peringkat" title="Umpan balik" />
      <div className="grid gap-6">
        <p className="max-w-[64ch] text-[15px] leading-relaxed text-muted">👍/👎 anonim dari pengunjung pada game yang direkomendasikan. Posisi teratas dan skor kecocokan tinggi seharusnya punya tingkat “pilihan tepat” lebih tinggi.</p>
        {!s ? (
          <p className={`${panel} p-6`}>Hubungkan database (DATABASE_URL) untuk mengumpulkan umpan balik.</p>
        ) : !s.total ? (
          <p className={`${panel} p-6 text-muted`}>Belum ada umpan balik. Akan muncul di sini saat pengunjung memakai rekomendasi.</p>
        ) : (
          <>
            <div className="grid gap-px overflow-hidden rounded-[18px] border border-line bg-line sm:grid-cols-3">
              <Metric label="Suara" value={String(s.total)} note={`${s.up} 👍 · ${s.total - s.up} 👎`} />
              <Metric label="Pilihan tepat" value={pct(s.up, s.total)} note="dari semua suara" />
              <Metric label="Pilihan tepat top-3" value={pct(top?.up ?? 0, top?.total ?? 0)} note={`dari ${top?.total ?? 0} suara`} />
            </div>
            <div className="grid items-start gap-6 lg:grid-cols-2">
              <Buckets title="Menurut posisi di daftar" hint="Seharusnya turun dari atas ke bawah." rows={s.byRank} ok="✓ Turun berurutan: peringkat bekerja." bad="Tidak berurutan: cek bobot kriteria." />
              <Buckets title="Menurut skor kecocokan" hint="Seharusnya turun saat skor turun." rows={s.byScore} ok="✓ Skor kecocokan bisa dipercaya." bad="Skor menyesatkan: cek normalisasi." />
            </div>
            <GameTable games={s.games} />
            <Recent rows={s.recent} />
          </>
        )}
      </div>
    </>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-card p-5">
      <p className="text-[13px] text-muted">{label}</p>
      <p className="mt-2 font-display text-[40px] font-bold leading-none tracking-[-0.04em] tabular">{value}</p>
      <p className="mt-2 font-mono text-xs text-muted">{note}</p>
    </div>
  );
}

function Buckets({ title, hint, rows, ok, bad }: { title: string; hint: string; rows: FeedbackStats["byRank"]; ok: string; bad: string }) {
  const rate = (r: FeedbackStats["byRank"][number]) => (r.total ? r.up / r.total : 0);
  const falling = rows.every((r, i) => i === 0 || rate(r) <= rate(rows[i - 1]));
  return (
    <section className={`${panel} grid gap-3.5 p-[22px]`}>
      <div><h2 className={h2}>{title}</h2><p className="mt-1 text-[13px] text-muted">{hint}</p></div>
      {rows.map((r, i) => (
        <div key={r.bucket} className="grid grid-cols-[72px_1fr_92px] items-center gap-3 text-sm">
          <span className="font-mono text-[13px]">{r.bucket}</span>
          <Bar value={pct(r.up, r.total)} tone={i === 0 ? "bg-table" : "bg-[#5f8f78]"} />
          <span className="text-right font-mono text-[13px]">{pct(r.up, r.total)} <span className="text-muted">/{r.total}</span></span>
        </div>
      ))}
      <p className={`border-t border-dashed border-line pt-3 text-[13px] ${falling ? "text-felt" : "text-meeple"}`}>{falling ? ok : bad}</p>
    </section>
  );
}

function GameTable({ games }: { games: FeedbackStats["games"] }) {
  return (
    <section className={`${panel} grid gap-3 p-[22px]`}>
      <div>
        <h2 className={h2}>Game paling banyak dinilai</h2>
        <p className="mt-1 text-[13px] text-muted">Banyak 👎 pada game yang sering di peringkat atas biasanya berarti datanya (waktu, bobot, usia) perlu dicek.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse text-sm">
          <thead><tr className={headRow}><th className="py-2.5 font-medium">Game</th><th className="p-2.5 text-right font-medium">👍</th><th className="p-2.5 text-right font-medium">👎</th><th className="w-2/5 py-2.5 font-medium">Pilihan tepat</th></tr></thead>
          <tbody>
            {games.map((g) => {
              const rate = pct(g.up, g.up + g.down);
              return (
                <tr key={g.id} className="border-t border-line">
                  <td className="py-2.5"><span className="flex items-center gap-2 font-semibold"><a className="hover:text-meeple" href={`/admin/games/${g.id}`}>{g.name}</a>
                    {g.down > g.up && <span className="rounded-full bg-meeple-soft px-2 py-0.5 font-mono text-[11px] font-semibold text-meeple">Cek data</span>}</span></td>
                  <td className="p-2.5 text-right font-mono text-[13px]">{g.up}</td>
                  <td className="p-2.5 text-right font-mono text-[13px]">{g.down}</td>
                  <td className="py-2.5"><span className="grid grid-cols-[1fr_44px] items-center gap-2.5"><Bar value={rate} tone={g.down > g.up ? "bg-meeple" : "bg-table"} /><span className="text-right font-mono text-[13px]">{rate}</span></span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Recent({ rows }: { rows: FeedbackStats["recent"] }) {
  return (
    <section className={`${panel} grid gap-3 p-[22px]`}>
      <h2 className={h2}>Suara terbaru</h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] border-collapse text-sm">
          <thead><tr className={headRow}><th className="py-2.5 font-medium">Waktu</th><th className="p-2.5 font-medium">Game</th><th className="p-2.5 font-medium">Suara</th><th className="p-2.5 text-right font-medium">Posisi</th><th className="p-2.5 text-right font-medium">Cocok</th><th /></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="whitespace-nowrap py-2.5 font-mono text-xs text-muted">{r.createdAt.slice(0, 16).replace("T", " ")}</td>
                <td className="p-2.5">{r.game}</td>
                <td className="p-2.5"><span className={`rounded-full px-2 py-0.5 font-mono text-xs font-semibold ${r.vote === 1 ? "bg-felt-soft text-felt" : "bg-meeple-soft text-meeple"}`}>{r.vote === 1 ? "👍 Tepat" : "👎 Kurang"}</span></td>
                <td className="p-2.5 text-right font-mono text-[13px]">#{r.rank}</td>
                <td className="p-2.5 text-right font-mono text-[13px]">{Math.round(r.score * 100)}%</td>
                <td className="py-2.5 text-right"><a className="text-[13px] text-felt underline underline-offset-[3px]" href={`/${r.lang}/recommend${r.query ? `?${r.query}` : ""}`} target="_blank">Buka pencarian · {r.lang.toUpperCase()}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
