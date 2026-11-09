"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LOCALE_COOKIE, locales, type Locale } from "@/i18n";

/** ID/EN pill: links to the same page in the other language and remembers the choice. */
export function LanguageSwitch({ from, to, label }: { from: Locale; to: Locale; label: string }) {
  const path = usePathname() ?? "/";
  const target = path.replace(/^\/(id|en)(?=\/|$)/, `/${to}`);
  return (
    <Link
      href={target}
      hrefLang={to}
      title={label}
      onClick={() => { document.cookie = `${LOCALE_COOKIE}=${to}; path=/; max-age=31536000; samesite=lax`; }}
      className="flex items-center gap-0.5 rounded-full border border-on-table/30 bg-black/20 p-[3px]"
    >
      <span className="sr-only">{label}</span>
      {locales.map((l) => (
        <span key={l} aria-hidden className={`rounded-full px-[11px] py-1.5 font-mono text-xs font-semibold uppercase transition-colors duration-200 ${l === from ? "bg-on-table text-table-ink" : "text-on-table-muted"}`}>
          {l}
        </span>
      ))}
    </Link>
  );
}
