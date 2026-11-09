"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n";
import { href } from "@/lib/i18n-paths";

const TABS = [
  { key: "find", path: "/recommend", icon: "◎" },
  { key: "reviews", path: "/reviews", icon: "★" },
  { key: "videos", path: "/videos", icon: "▶︎" },
  { key: "news", path: "/news", icon: "≡" },
] as const;

/** Floating thumb-reach navigation on phones. "Find" also covers the home page, whose hero is the finder. */
export function MobileTabs({ lang, label, labels }: { lang: Locale; label: string; labels: Record<(typeof TABS)[number]["key"], string> }) {
  const path = usePathname() ?? "";
  const isActive = (tab: (typeof TABS)[number]) =>
    path.startsWith(href(lang, tab.path)) || (tab.key === "find" && path === href(lang));
  return (
    <nav aria-label={label} className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-20 grid grid-cols-4 rounded-[22px] bg-[#1f1b16]/85 p-1.5 shadow-[0_12px_30px_rgba(0,0,0,0.3)] backdrop-blur-md min-[721px]:hidden">
      {TABS.map((tab) => {
        const active = isActive(tab);
        return (
          <Link key={tab.key} href={href(lang, tab.path)} aria-current={active ? "page" : undefined}
            className={`grid min-h-[52px] place-items-center content-center gap-[3px] rounded-2xl text-[11px] font-medium ${active ? "bg-on-table text-table-ink" : "text-[#cfc6b6]"}`}>
            <span aria-hidden className="text-[17px] leading-none">{tab.icon}</span>
            {labels[tab.key]}
          </Link>
        );
      })}
    </nav>
  );
}
