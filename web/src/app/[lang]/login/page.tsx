import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-3xl font-semibold tracking-tight">{t.auth.title}</h1>
      <p className="mt-2 text-muted">{t.auth.intro}</p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-sunken" />}>
          <LoginForm t={t} home={href(lang)} />
        </Suspense>
      </div>
    </div>
  );
}
