"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, type Locale } from "@/i18n";

/** Links to the same page in the other language and remembers the choice. */
export function LanguageSwitch({ to, label, short }: { to: Locale; label: string; short: string }) {
  const path = usePathname() ?? "/";
  const target = path.replace(/^\/(id|en)(?=\/|$)/, `/${to}`);
  return (
    <Link
      href={target}
      hrefLang={to}
      title={label}
      onClick={() => { document.cookie = `${LOCALE_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`; }}
      className="rounded-md border border-line px-2 py-1 text-xs font-medium text-muted hover:bg-sunken hover:text-ink"
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden>{short}</span>
    </Link>
  );
}
