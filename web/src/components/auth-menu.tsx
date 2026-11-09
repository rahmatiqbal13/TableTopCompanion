"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getMyAccount, type MyAccount } from "@/app/account-actions";
import type { Locale } from "@/i18n";
import { href } from "@/lib/i18n-paths";
import { supabaseBrowser } from "@/lib/supabase/browser";

/** "Sign in" link or the account menu. Rendered only when accounts are configured. */
export interface AuthMenuLabels { signIn: string; account: string; myGames: string; admin: string; signOut: string }

export function AuthMenu({ lang, labels: l }: { lang: Locale; labels: AuthMenuLabels }) {
  const sb = supabaseBrowser();
  const path = usePathname() ?? "/";
  const router = useRouter();
  const [account, setAccount] = useState<MyAccount | null | undefined>(undefined);

  useEffect(() => {
    if (!sb) return;
    let alive = true;
    const load = async (signedIn: boolean) => {
      const a = signedIn ? await getMyAccount() : null;
      if (alive) setAccount(a);
    };
    sb.auth.getSession().then(({ data }) => load(Boolean(data.session)));
    const { data: sub } = sb.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") void load(Boolean(session));
    });
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, [sb]);

  if (!sb) return null;
  if (account === undefined) return <span className="h-8 w-16 animate-pulse rounded-full bg-on-table/15" aria-hidden />;
  if (!account) {
    return (
      <Link href={`${href(lang, "/login")}?next=${encodeURIComponent(path)}`}
        className="rounded-full bg-on-table px-3 py-2 text-xs font-medium text-table-ink hover:opacity-90">
        {l.signIn}
      </Link>
    );
  }
  const initial = (account.name ?? account.email ?? "?").trim().charAt(0).toUpperCase();
  const quick = "hidden rounded-full px-2.5 py-1.5 text-xs font-medium text-on-table-muted hover:bg-on-table/10 hover:text-on-table sm:block";
  return (
    <>
    <Link href={href(lang, "/me")} className={quick}>{l.myGames}</Link>
    {account.role !== "user" && (
      // The admin area has its own root layout, so a full page load is needed anyway.
      // eslint-disable-next-line @next/next/no-html-link-for-pages
      <a href="/admin" className={quick}>{l.admin}</a>
    )}
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full px-1 py-1 hover:bg-on-table/10" aria-label={l.account}>
        {account.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element -- Google profile photo
          <img src={account.avatar} alt="" width={28} height={28} referrerPolicy="no-referrer" className="size-7 rounded-full" />
        ) : (
          <span className="grid size-7 place-items-center rounded-full bg-on-table text-xs font-semibold text-table-ink">{initial}</span>
        )}
      </summary>
      <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-line bg-card p-1.5 text-sm text-ink shadow-lg">
        <p className="truncate px-3 py-2 text-xs text-muted">{account.email ?? account.name}</p>
        <Link href={href(lang, "/me")} className="block rounded-lg px-3 py-2 hover:bg-sunken">{l.myGames}</Link>
        {account.role !== "user" && (
          // The admin area has its own root layout, so a full page load is needed anyway.
          // eslint-disable-next-line @next/next/no-html-link-for-pages
          <a href="/admin" className="block rounded-lg px-3 py-2 hover:bg-sunken">{l.admin}</a>
        )}
        <button type="button" className="block w-full rounded-lg px-3 py-2 text-left hover:bg-sunken"
          onClick={async () => { await sb.auth.signOut(); setAccount(null); router.refresh(); }}>
          {l.signOut}
        </button>
      </div>
    </details>
    </>
  );
}
