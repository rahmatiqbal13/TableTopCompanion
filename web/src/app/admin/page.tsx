import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AdminSignIn } from "@/components/admin-signin";
import { AdminSignOut } from "@/components/admin-sign-out";
import { currentAccount } from "@/lib/account";
import { canEdit, isAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/data";
import { refreshSiteData } from "./actions";

export const metadata: Metadata = { title: "Dashboard · Admin", robots: { index: false } };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Suspense fallback={<p className="text-muted">Loading…</p>}>
        <Dashboard />
      </Suspense>
    </div>
  );
}

const pct = (up: number, total: number) => (total ? `${Math.round((up / total) * 100)}%` : "–");

async function Dashboard() {
  await connection();
  if (!(await canEdit())) return <AdminSignIn />;
  const [admin, account, o] = await Promise.all([isAdmin(), currentAccount(), getAdminOverview()]);
  const card = "rounded-2xl border border-line bg-card p-5";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {account?.profile.displayName ? `Hi, ${account.profile.displayName.split(" ")[0]}` : "Dashboard"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {account
              ? <>Signed in as <strong>{account.user.email}</strong> · {account.profile.role}</>
              : "Signed in with the shared admin password"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <form action={refreshSiteData}>
            <button className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-sunken"
              title="Use after editing tables directly in Supabase">↻ Refresh site data</button>
          </form>
          <AdminSignOut />
        </div>
      </div>

      {!o ? (
        <p className={card}>Connect a database (DATABASE_URL) to see numbers here.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat href={admin ? "/admin/catalog" : undefined} label="Games" value={o.games.total} note={`${o.games.noImage} without image`} />
            <Stat href="/admin/posts" label="Published posts" value={o.posts.published} note={`${o.posts.drafts.length} draft${o.posts.drafts.length === 1 ? "" : "s"} waiting`} />
            <Stat href={admin ? "/admin/users" : undefined} label="Users" value={o.users.total} note={`${o.users.newThisWeek} new this week · ${o.users.ratings} ratings`} />
            <Stat href={admin ? "/admin/feedback" : undefined} label="Good pick rate" value={pct(o.feedback.up, o.feedback.total)} note={`${o.feedback.total} votes · ${o.feedback.thisWeek} this week`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className={card}>
              <h2 className="font-display text-lg font-semibold">To do</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {o.posts.drafts.map((d) => (
                  <li key={d.id}>
                    <Link href={`/admin/posts/${d.id}`} className="hover:underline">✎ Finish draft: <strong>{d.title}</strong></Link>
                    <span className="ml-2 text-xs capitalize text-muted">{d.type}</span>
                  </li>
                ))}
                {admin && o.games.noImage > 0 && (
                  <li><Link href="/admin/catalog" className="hover:underline">🖼 {o.games.noImage} games have no image</Link></li>
                )}
                {admin && o.games.noBgg > 0 && (
                  <li className="text-muted">🔗 {o.games.noBgg} games not linked to BoardGameGeek (run the BGG import once you have a token)</li>
                )}
                {!o.posts.drafts.length && !(admin && (o.games.noImage || o.games.noBgg)) && <li className="text-muted">Nothing waiting. 🎉</li>}
              </ul>
            </section>
            <section className={card}>
              <h2 className="font-display text-lg font-semibold">Quick actions</h2>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <Link href="/admin/posts/new" className="rounded-lg bg-felt px-3.5 py-1.5 font-medium text-on-felt">New post</Link>
                {admin && <Link href="/admin/games/new" className="rounded-lg border border-line px-3.5 py-1.5 hover:bg-sunken">Add game</Link>}
                {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- public site has its own root layout */}
                <a href="/" className="rounded-lg border border-line px-3.5 py-1.5 hover:bg-sunken">View site ↗</a>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, note, href }: { label: string; value: number | string; note: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold tabular">{value}</p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </>
  );
  const cls = "block rounded-2xl border border-line bg-card p-5";
  return href ? <Link href={href} className={`${cls} hover:bg-sunken`}>{body}</Link> : <div className={cls}>{body}</div>;
}
