import Link from "next/link";
import type { Dict, Locale } from "@/i18n";
import { href } from "@/lib/i18n-paths";

/** "How it works": the TOPSIS closeness formula and a link to the full method. Home and /recommend. */
export function MethodBox({ t, lang }: { t: Dict; lang: Locale }) {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-[72px]">
      <div className="grid items-center gap-8 rounded-3xl bg-sunken p-[clamp(28px,5vw,56px)] lg:grid-cols-2">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-felt">{t.home.method.kicker}</p>
          <h2 className="mt-3 text-balance font-display text-[clamp(30px,3.6vw,44px)] font-bold leading-[1.05] tracking-[-0.035em]">{t.home.method.title}</h2>
          <p className="mt-3.5 max-w-[48ch] leading-relaxed text-muted">{t.home.method.body}</p>
          <Link href={href(lang, "/method")} className="mt-[22px] inline-flex min-h-11 items-center gap-2.5 rounded-full bg-ink py-1.5 pl-5 pr-2 text-[15px] font-medium text-paper transition-colors hover:opacity-90">
            {t.home.method.cta}
            <span aria-hidden className="grid size-[30px] place-items-center rounded-full bg-paper/15">→</span>
          </Link>
        </div>
        <div className="rounded-[18px] border border-line bg-card p-7 font-mono">
          <p className="text-[13px] text-muted">{t.home.method.formula}</p>
          <p className="mt-3.5 text-[clamp(26px,3vw,36px)] font-medium tracking-[-0.02em]">V = D⁻ / (D⁺ + D⁻)</p>
          <div className="mt-5 grid gap-2 text-[13px]">
            <div className="flex justify-between gap-4 border-t border-line pt-2.5"><span>D⁺</span><span className="text-right text-muted">{t.home.method.dPlus}</span></div>
            <div className="flex justify-between gap-4 border-t border-line pt-2.5"><span>D⁻</span><span className="text-right text-muted">{t.home.method.dMinus}</span></div>
          </div>
          <p className="mt-5 font-sans text-sm text-felt">{t.home.method.ads}</p>
        </div>
      </div>
    </section>
  );
}
