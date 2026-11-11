import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/ui";
import { getDict, hasLocale } from "@/i18n";
import { href } from "@/lib/i18n-paths";

export async function generateMetadata({ params }: PageProps<"/[lang]/method">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { title: getDict(lang).method.title, alternates: { languages: { id: "/id/method", en: "/en/method" } } };
}

export default async function MethodPage({ params }: PageProps<"/[lang]/method">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDict(lang);
  const m = t.method;
  return (
    <>
    <PageHero kicker={t.heroes.method.kicker} title={t.heroes.method.title} sub={t.heroes.method.sub} width="max-w-3xl" />
    <article className="mx-auto max-w-3xl px-4 pb-20 pt-12">
      <p className="text-lg leading-relaxed text-muted">{m.intro}</p>
      <ol className="mt-8 space-y-6">
        {m.steps.map(([title, body]) => (
          <li key={title} className="rounded-2xl border border-line bg-card p-5">
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed">{body}</p>
          </li>
        ))}
      </ol>
      <h2 className="mt-10 font-display text-xl font-semibold">{m.changesTitle}</h2>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
        {m.changes.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <p className="mt-8 rounded-xl bg-felt-soft p-4 text-sm">{m.ads}</p>
      <p className="mt-6 text-sm"><Link href={href(lang, "/recommend")} className="underline">{t.home.ctaFind} →</Link></p>
    </article>
    </>
  );
}
