import Link from "next/link";
import { otherLocale, type Dict, type Locale } from "@/i18n";
import { href } from "@/lib/i18n-paths";
import { authConfigured } from "@/lib/supabase/config";
import { AuthMenu } from "./auth-menu";
import { LanguageSwitch } from "./language-switch";
import { SiteNav } from "./site-nav";

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
  return (
    <header className="table-surface text-on-table">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-4">
        <Link href={href(lang)} aria-label="TableTop Companion" className="grid justify-items-center text-on-table">
          <Mascot />
          <span className="block rounded-lg bg-on-table px-2.5 pb-1 pt-[3px] font-display text-[19px] font-extrabold leading-none tracking-[-0.04em] text-table">TableTop</span>
          <span className="mt-1 block pl-[0.42em] font-mono text-[9px] font-semibold uppercase tracking-[0.42em] text-table-gold">Companion</span>
        </Link>
        <SiteNav lang={lang} label={t.nav.menu} items={nav} />
        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <LanguageSwitch from={lang} to={other} label={t.nav.switchLabel} />
          {authConfigured && (
            <AuthMenu lang={lang} labels={{ signIn: t.auth.signIn, account: t.auth.account, myGames: t.auth.myGames, admin: t.nav.admin, signOut: t.auth.signOut }} />
          )}
        </div>
      </div>
    </header>
  );
}

/** The dragon that peeks over the wordmark. */
function Mascot() {
  return (
    <svg width="62" height="42" viewBox="8 6 104 70" aria-hidden className="relative -mb-1 block">
      <path d="M32 66C16 56 10 42 15 30c6 11 13 16 23 22z" fill="#b9471a" />
      <path d="M88 66c16-10 22-24 17-36-6 11-13 16-23 22z" fill="#b9471a" />
      <ellipse cx="60" cy="72" rx="29" ry="13" fill="#f0875a" />
      <ellipse cx="60" cy="72" rx="15" ry="7" fill="#e0b44a" />
      <path d="M45 28l-5-17 13 13z" fill="#e0b44a" />
      <path d="M75 28l5-17-13 13z" fill="#e0b44a" />
      <path d="M54 23l6-7 6 7z" fill="#b9471a" />
      <ellipse cx="60" cy="44" rx="27" ry="23" fill="#f0875a" />
      <circle cx="39" cy="52" r="4" fill="#b9471a" opacity="0.45" />
      <circle cx="81" cy="52" r="4" fill="#b9471a" opacity="0.45" />
      <ellipse cx="60" cy="54" rx="12" ry="8" fill="#f6a983" />
      <circle cx="55.5" cy="52.5" r="1.6" fill="#1f1b16" />
      <circle cx="64.5" cy="52.5" r="1.6" fill="#1f1b16" />
      <circle cx="47" cy="40" r="5" fill="#1f1b16" />
      <circle cx="48.6" cy="38.4" r="1.7" fill="#fff" />
      <circle cx="73" cy="40" r="5" fill="#1f1b16" />
      <circle cx="74.6" cy="38.4" r="1.7" fill="#fff" />
      <path d="M54 60q6 4 12 0" stroke="#1f1b16" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="36" cy="71" rx="9" ry="4.5" fill="#f0875a" />
      <ellipse cx="84" cy="71" rx="9" ry="4.5" fill="#f0875a" />
    </svg>
  );
}

export function Meeple({ className = "text-felt" }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden className={className}>
      <path fill="currentColor" d="M12 2a3.2 3.2 0 0 1 3.2 3.2c0 .9-.4 1.8-1 2.4 3 .5 7.3 1.6 7.3 3.8 0 1.4-2 2-4.2 2.1l2.8 6.1c.4.8-.2 1.6-1 1.6h-3.3L12 16.4 8.2 21.2H4.9c-.8 0-1.4-.8-1-1.6l2.8-6.1c-2.2-.1-4.2-.7-4.2-2.1 0-2.2 4.3-3.3 7.3-3.8-.6-.6-1-1.5-1-2.4A3.2 3.2 0 0 1 12 2Z" />
    </svg>
  );
}
