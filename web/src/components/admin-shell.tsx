import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { refreshSiteData } from "@/app/admin/actions";
import { currentAccount } from "@/lib/account";
import { canEdit, isAdmin } from "@/lib/auth";
import { getAdminOverview } from "@/lib/data";
import { AdminNav, type NavItem } from "./admin-nav";
import { AdminSignOut } from "./admin-sign-out";
import { eyebrow, pillGhost } from "./admin-ui";

function Logo() {
  return (
    <Link href="/admin" aria-label="Admin TableTop Companion" className="flex items-center gap-2.5 px-1.5">
      <svg width="40" height="30" viewBox="10 8 100 60" aria-hidden>
        <path d="M45 28l-5-17 13 13z" fill="#e0b44a" />
        <path d="M75 28l5-17-13 13z" fill="#e0b44a" />
        <ellipse cx="60" cy="44" rx="27" ry="23" fill="#f0875a" />
        <ellipse cx="60" cy="54" rx="12" ry="8" fill="#f6a983" />
        <circle cx="55.5" cy="52.5" r="1.6" fill="#1f1b16" />
        <circle cx="64.5" cy="52.5" r="1.6" fill="#1f1b16" />
        <circle cx="47" cy="40" r="5" fill="#1f1b16" />
        <circle cx="48.6" cy="38.4" r="1.7" fill="#fff" />
        <circle cx="73" cy="40" r="5" fill="#1f1b16" />
        <circle cx="74.6" cy="38.4" r="1.7" fill="#fff" />
        <path d="M54 60q6 4 12 0" stroke="#1f1b16" strokeWidth="2" fill="none" strokeLinecap="round" />
      </svg>
      <span className="grid gap-[3px]">
        <span className="font-display text-lg font-extrabold leading-none tracking-[-0.04em]">TableTop</span>
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.32em] text-table-gold">Admin</span>
      </span>
    </Link>
  );
}

/** The felt sidebar. Links and counts appear only once someone is signed in. */
export function AdminSidebar() {
  return (
    <aside className="table-surface relative w-full shrink-0 text-on-table lg:w-[232px]">
      <div className="flex flex-col gap-3 p-3.5 lg:sticky lg:top-0 lg:h-screen lg:gap-6 lg:overflow-y-auto lg:py-5">
        <Logo />
        <Suspense fallback={null}>
          <SidebarBody />
        </Suspense>
      </div>
    </aside>
  );
}

async function SidebarBody() {
  await connection(); // the counts and the role are per request
  if (!(await canEdit())) return null;
  const [admin, o] = await Promise.all([isAdmin(), getAdminOverview()]);
  const items: NavItem[] = [
    { href: "/admin", icon: "◎", label: "Ringkasan", exact: true },
    ...(admin ? [{ href: "/admin/catalog", also: "/admin/games", icon: "▦", label: "Katalog game", count: o?.games.noImage }] : []),
    { href: "/admin/posts", icon: "★", label: "Konten", count: o?.posts.draftCount, except: "/admin/posts/new" },
    { href: "/admin/posts/new", icon: "✎", label: "Tulis", exact: true },
    ...(admin ? [{ href: "/admin/recommend", icon: "⚖", label: "Rekomendasi" }] : []),
    { href: "/admin/local", icon: "⌂", label: "Main di sekitarmu", count: o?.listings.drafts },
    ...(admin ? [
      { href: "/admin/feedback", icon: "⇅", label: "Umpan balik", count: o?.feedback.flagged },
      { href: "/admin/users", icon: "◍", label: "Pengguna" },
    ] : []),
  ];
  return (
    <>
      <AdminNav items={items} />
      {o && admin && (
        <div className="mt-auto hidden rounded-[14px] bg-black/20 p-3 text-[13px] leading-snug text-on-table-muted lg:block">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-table-gold">Data BGG</p>
          <p className="mt-1.5">{o.games.total - o.games.noBgg} dari {o.games.total} game tertaut ke BoardGameGeek.</p>
        </div>
      )}
    </>
  );
}

/** Page heading with the account, shared by every signed-in admin page. */
export async function AdminHeader({ kicker, title }: { kicker: string; title: string }) {
  const [account, admin] = await Promise.all([currentAccount(), isAdmin()]);
  const name = account?.profile.displayName ?? account?.user.email ?? "Admin";
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-4">
      <div>
        <p className={`${eyebrow} text-felt`}>{kicker}</p>
        <h1 className="mt-2 font-display text-[clamp(30px,4vw,44px)] font-bold leading-none tracking-[-0.035em]">{title}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2.5">
        <form action={refreshSiteData}>
          <button title="Pakai setelah mengubah tabel langsung di Supabase" className={`${pillGhost} min-h-10! px-3.5! text-[13px]! bg-card`}>↻ Muat ulang data situs</button>
        </form>
        <span className="grid gap-px text-right">
          <span className="text-sm font-medium">{account ? `${name.split(" ")[0]} · ${admin ? "Admin" : "Editor"}` : "Admin"}</span>
          <span className="font-mono text-[11px] text-muted"><AdminSignOut /></span>
        </span>
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-meeple text-sm font-semibold text-white">{name[0]?.toUpperCase()}</span>
      </div>
    </header>
  );
}
