import type { Metadata } from "next";
import Link from "next/link";
import { Meeple } from "@/components/site-header";
import { fontClasses } from "../fonts";
import "../globals.css";

export const metadata: Metadata = { title: "Admin · TableTop Companion", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/catalog", label: "Catalog" },
    { href: "/admin/posts", label: "Posts" },
    { href: "/admin/feedback", label: "Feedback" },
    { href: "/admin/users", label: "Users" },
  ];
  return (
    <html lang="en" className={fontClasses}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/admin" className="flex items-center gap-2 font-display text-lg font-semibold">
              <Meeple /> Admin
            </Link>
            <nav className="flex gap-1 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="rounded-md px-2.5 py-1.5 text-muted hover:bg-sunken hover:text-ink">{l.label}</Link>
              ))}
            </nav>
            <Link href="/" className="ml-auto text-sm text-muted underline">View site</Link>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
