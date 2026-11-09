import Link from "next/link";
import { otherLocale, type Dict, type Locale } from "@/i18n";
import { href } from "@/lib/i18n-paths";
import { authConfigured } from "@/lib/supabase/config";
import { AuthMenu } from "./auth-menu";
import { LanguageSwitch } from "./language-switch";

export function SiteHeader({ lang, t }: { lang: Locale; t: Dict }) {
  const nav = [
    { path: "/recommend", label: t.nav.recommend },
    { path: "/games", label: t.nav.games },
    { path: "/reviews", label: t.nav.reviews },
    { path: "/videos", label: t.nav.videos },
    { path: "/news", label: t.nav.news },
    { path: "/guides", label: t.nav.guides },
  ];
  const other = otherLocale(lang);
  const otherDict = { label: t.nav.switchLabel, short: t.nav.switchShort };
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href={href(lang)} className="flex shrink-0 items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Meeple /> <span>TableTop Companion</span>
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitch to={other} label={otherDict.label} short={otherDict.short} />
          {authConfigured && (
            <AuthMenu lang={lang} labels={{ signIn: t.auth.signIn, account: t.auth.account, myGames: t.auth.myGames, admin: t.nav.admin, signOut: t.auth.signOut }} />
          )}
        </div>
      </div>
      <nav aria-label={t.nav.menu} className="mx-auto max-w-6xl overflow-x-auto px-2 pb-2 [scrollbar-width:none]">
        <ul className="flex gap-1 text-sm">
          {nav.map((n) => (
            <li key={n.path}>
              <Link href={href(lang, n.path)} className="block whitespace-nowrap rounded-md px-2.5 py-1.5 text-muted hover:bg-sunken hover:text-ink">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function Meeple({ className = "text-felt" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="currentColor" d="M12 2a3.2 3.2 0 0 1 3.2 3.2c0 .9-.4 1.8-1 2.4 3 .5 7.3 1.6 7.3 3.8 0 1.4-2 2-4.2 2.1l2.8 6.1c.4.8-.2 1.6-1 1.6h-3.3L12 16.4 8.2 21.2H4.9c-.8 0-1.4-.8-1-1.6l2.8-6.1c-2.2-.1-4.2-.7-4.2-2.1 0-2.2 4.3-3.3 7.3-3.8-.6-.6-1-1.5-1-2.4A3.2 3.2 0 0 1 12 2Z" />
    </svg>
  );
}
