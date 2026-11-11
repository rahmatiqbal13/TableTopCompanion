"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n";
import { href } from "@/lib/i18n-paths";

/** Top navigation; the section you are in is lit up, and game pages count as "Games". */
export function SiteNav({ lang, label, items }: { lang: Locale; label: string; items: { path: string; label: string }[] }) {
  const path = usePathname() ?? "";
  return (
    <nav aria-label={label} className="order-last -mx-1 w-full overflow-x-auto [scrollbar-width:none] md:order-none md:mx-0 md:ml-auto md:w-auto">
      <ul className="flex gap-0.5 text-sm">
        {items.map((n) => {
          const base = href(lang, n.path);
          const active = path === base || path.startsWith(`${base}/`);
          return (
            <li key={n.path}>
              <Link href={base} aria-current={active ? "page" : undefined}
                className={`block whitespace-nowrap rounded-full px-3 py-2 transition-colors ${
                  active ? "bg-on-table font-semibold text-table-ink" : "text-on-table-muted hover:bg-on-table/10 hover:text-on-table"
                }`}>
                {n.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
