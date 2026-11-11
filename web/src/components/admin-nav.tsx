"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavItem {
  href: string;
  icon: string;
  label: string;
  count?: number;
  /** Match the path exactly instead of by prefix. */
  exact?: boolean;
  /** A second path prefix that counts as this section. */
  also?: string;
  /** A path under this one that belongs to another item. */
  except?: string;
}

const isActive = (path: string, i: NavItem) => {
  if (path === i.except) return false;
  if (i.exact) return path === i.href;
  return path === i.href || path.startsWith(`${i.href}/`) || (i.also !== undefined && path.startsWith(`${i.also}/`));
};

export function AdminNav({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-1 flex gap-0.5 overflow-x-auto px-1 lg:flex-col lg:overflow-visible">
      {items.map((i) => {
        const active = isActive(path, i);
        return (
          <Link key={i.href} href={i.href} aria-current={active ? "page" : undefined}
            className={`flex min-h-11 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors hover:bg-on-table/10 ${active ? "bg-on-table/15 text-on-table" : "text-on-table-muted"}`}>
            <span aria-hidden className="w-[18px] text-center text-[15px]">{i.icon}</span>
            <span className="flex-1">{i.label}</span>
            {!!i.count && <span className="min-w-[22px] rounded-full bg-table-gold px-[7px] py-0.5 text-center font-mono text-[11px] font-semibold text-table-ink">{i.count}</span>}
          </Link>
        );
      })}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- the public site has its own root layout */}
      <a href="/" className="flex min-h-10 shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-3 text-sm text-on-table-muted hover:bg-on-table/10 hover:text-on-table">
        <span aria-hidden className="w-[18px] text-center">↗</span>Lihat situs
      </a>
    </nav>
  );
}
