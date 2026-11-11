import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";
import { Suspense } from "react";
import { LoginForm } from "@/components/login-form";
import { getDict, hasLocale } from "@/i18n";
import { href } from "@/lib/i18n-paths";

export async function generateMetadata({ params }: PageProps<"/[lang]/login">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDict(lang).auth.title, robots: { index: false } };
}

export default async function LoginPage({ params }: PageProps<"/[lang]/login">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  return (
    <>
    <PageHero kicker={t.heroes.login.kicker} title={t.heroes.login.title} sub={t.auth.intro} />
    <div className="mx-auto max-w-md px-4 pb-24 pt-12">
      <div className="rounded-[22px] border border-line bg-card p-[clamp(22px,4vw,32px)]">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-sunken" />}>
          <LoginForm t={t} home={href(lang)} />
        </Suspense>
      </div>
    </div>
    </>
  );
}
