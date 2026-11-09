import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MobileTabs } from "@/components/mobile-tabs";
import { SiteHeader } from "@/components/site-header";
import { getDict, hasLocale, locales } from "@/i18n";
import { href } from "@/lib/i18n-paths";
import { fontClasses } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = getDict(lang);
  return {
    metadataBase: process.env.VERCEL_PROJECT_PRODUCTION_URL ? new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`) : undefined,
    title: { default: t.meta.title, template: `%s · ${t.meta.title}` },
    description: t.meta.description,
    alternates: { languages: { id: "/id", en: "/en" } },
  };
}

export default async function LangLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <html lang={lang} className={fontClasses}>
      <body className="flex min-h-full flex-col">
        <SiteHeader lang={lang} t={t} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line pb-24 text-sm text-muted min-[721px]:pb-0">
          <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-x-8 gap-y-3 px-4 pb-10 pt-7">
            <span className="font-display font-bold text-ink">TableTop Companion</span>
            <span>
              {t.footer.data}{" "}
              <a className="underline hover:text-ink" href="https://boardgamegeek.com" target="_blank" rel="noreferrer">BoardGameGeek</a>
            </span>
            <span>
              <Link href={href(lang, "/local")} className="underline hover:text-ink">{t.local.title}</Link> · {t.footer.method} · <Link href={href(lang, "/method")} className="underline hover:text-ink">{t.footer.methodLink}</Link>
            </span>
          </div>
        </footer>
        <MobileTabs lang={lang} label={t.nav.menu} labels={{ find: t.nav.find, reviews: t.nav.reviews, videos: t.nav.videos, news: t.nav.news }} />
      </body>
    </html>
  );
}
