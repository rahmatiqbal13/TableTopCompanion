import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminHeader } from "@/components/admin-shell";
import { AdminSignIn } from "@/components/admin-signin";
import { Bar, h2, panel, pct, pillFelt, pillGhost } from "@/components/admin-ui";
import { currentAccount } from "@/lib/account";
import { canEdit, isAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/data";

export const metadata: Metadata = { title: "Ringkasan · Admin", robots: { index: false } };

export default function DashboardPage() {
  return (
    <Suspense fallback={<p className="text-muted">Memuat…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await connection();
  if (!(await canEdit())) return <AdminSignIn />;
  const [admin, account, o] = await Promise.all([isAdmin(), currentAccount(), getAdminOverview()]);
  const first = account?.profile.displayName?.split(" ")[0];
  const header = (
    <AdminHeader title={first ? `Halo, ${first}.` : "Ringkasan"}
      kicker={account?.user.email ? `${admin ? "Admin" : "Editor"} · ${account.user.email}` : "Masuk dengan kata sandi admin"} />
  );
  if (!o) return <>{header}<p className={`${panel} p-6`}>Hubungkan database (DATABASE_URL) untuk melihat angka di sini.</p></>;

  const todos = [
    { n: o.posts.draftCount, title: "Konten belum terbit", sub: "Draf yang menunggu diselesaikan", href: "/admin/posts", tone: "text-meeple" },
    ...(admin ? [
      { n: o.games.noImage, title: "Game tanpa gambar", sub: "Sampul kosong di kartu dan halaman game", href: "/admin/catalog?filter=noimage", tone: "text-meeple" },
      { n: o.games.noBgg, title: "Belum tertaut BoardGameGeek", sub: "Jalankan impor BGG setelah token tersedia", href: "/admin/catalog?filter=nobgg", tone: "text-gold" },
      { n: o.games.noText, title: "Game tanpa deskripsi", sub: "Halaman game tampil tanpa penjelasan", href: "/admin/catalog?filter=notext", tone: "text-gold" },
      { n: o.feedback.flagged, title: "Game lebih banyak 👎", sub: "Cek waktu, bobot, dan usia di datanya", href: "/admin/feedback", tone: "text-meeple" },
    ] : []),
    { n: o.listings.drafts, title: "Listing lokal masih draf", sub: "Kafe, komunitas, game buatan Indonesia", href: "/admin/local", tone: "text-felt" },
  ].filter((t) => t.n > 0);
  const top = o.feedback.topGames[0]?.votes ?? 1;

  return (
    <>
      {header}
      <div className="grid gap-7">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[18px] border border-line bg-line lg:grid-cols-4">
          <Stat href={admin ? "/admin/catalog" : undefined} label="Game" value={o.games.total} note={`${o.games.noImage} tanpa gambar`} warn={o.games.noImage > 0} />
          <Stat href="/admin/posts" label="Konten terbit" value={o.posts.published} note={`${o.posts.draftCount} draf menunggu`} />
          <Stat href={admin ? "/admin/users" : undefined} label="Pengguna" value={o.users.total} note={`${o.users.newThisWeek} baru minggu ini · ${o.users.ratings} rating`} good />
          <Stat href={admin ? "/admin/feedback" : undefined} label="Tingkat pilihan tepat" value={pct(o.feedback.up, o.feedback.total)} note={`${o.feedback.total} suara · ${o.feedback.thisWeek} minggu ini`} good />
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-2">
          <section className={`${panel} p-[22px]`}>
            <h2 className={`${h2} mb-1.5`}>Perlu perhatian</h2>
            {todos.map((t) => (
              <Link key={t.title} href={t.href} className="flex min-h-[60px] items-center gap-3.5 border-t border-line py-3 hover:text-meeple">
                <span className={`min-w-9 font-display text-[28px] font-extrabold tracking-[-0.04em] tabular ${t.tone}`}>{t.n}</span>
                <span className="flex-1"><span className="block text-[15px] font-semibold">{t.title}</span><span className="mt-0.5 block text-[13px] text-muted">{t.sub}</span></span>
                <span aria-hidden>→</span>
              </Link>
            ))}
            {!todos.length && <p className="border-t border-line py-4 text-muted">Tidak ada yang menunggu.</p>}
            <div className="flex flex-wrap gap-2 border-t border-dashed border-line pt-4">
              <Link href="/admin/posts/new" className={pillFelt}>✎ Konten baru</Link>
              {admin && <Link href="/admin/games/new" className={`${pillGhost} min-h-10!`}>+ Tambah game</Link>}
              <Link href="/admin/local/new" className={`${pillGhost} min-h-10!`}>+ Listing lokal</Link>
            </div>
          </section>

          <section className={`${panel} p-[22px]`}>
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className={h2}>Paling banyak dinilai</h2>
              <span className="font-mono text-xs text-muted">7 hari</span>
            </div>
            {o.feedback.topGames.length ? (
              <div className="grid gap-3">
                {o.feedback.topGames.map((g, i) => (
                  <div key={g.name} className="grid grid-cols-[minmax(0,150px)_1fr_44px] items-center gap-3 text-sm">
                    <span className="truncate">{g.name}</span>
                    <Bar value={pct(g.votes, top)} tone={i === 0 ? "bg-meeple" : "bg-table"} />
                    <span className="text-right font-mono text-[13px]">{g.votes}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-muted">Belum ada penilaian minggu ini.</p>}
            <p className="mt-[18px] border-t border-dashed border-line pt-3.5 text-[13px] text-muted">Dari tombol 👍/👎 pengunjung pada hasil rekomendasi.</p>
          </section>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, note, href, warn, good }: { label: string; value: number | string; note: string; href?: string; warn?: boolean; good?: boolean }) {
  const body = (
    <>
      <span className="flex justify-between text-[13px] text-muted">{label}{href && <span aria-hidden>→</span>}</span>
      <span className="mt-2 block font-display text-[40px] font-bold leading-none tracking-[-0.04em] tabular">{value}</span>
      <span className={`mt-2 block font-mono text-xs ${warn ? "text-meeple" : good ? "text-felt" : "text-muted"}`}>{note}</span>
    </>
  );
  const cls = "block bg-card p-5";
  return href ? <Link href={href} className={`${cls} hover:bg-sunken`}>{body}</Link> : <div className={cls}>{body}</div>;
}
