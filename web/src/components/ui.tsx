/** Small shared UI primitives (server- and client-safe). */

export function Chip({ active, onClick, children, title }: {
  active: boolean; onClick: () => void; children: React.ReactNode; title?: string;
}) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active} title={title}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active ? "border-felt bg-felt text-on-felt" : "border-line bg-paper text-ink hover:border-muted"
      }`}>
      {children}
    </button>
  );
}

export function Panel({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold">{title}</h2>
        {action}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function SectionHeading({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-4">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

/** Neutral placeholder while a page streams in. */
export function PageSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-6xl animate-pulse space-y-4 px-4 pt-10">
      <div className="h-4 w-24 rounded bg-sunken" />
      <div className="h-12 w-2/3 rounded-lg bg-sunken" />
      <div className="h-5 w-1/2 rounded bg-sunken" />
      <div className="h-72 rounded-2xl bg-sunken" />
    </div>
  );
}

/** The felt band under the header that opens every sub-page, so the table carries on from the header. */
export function PageHero({ kicker, title, sub, children, width = "max-w-6xl" }: {
  kicker: string; title: React.ReactNode; sub?: React.ReactNode; children?: React.ReactNode; width?: string;
}) {
  return (
    <section className="table-surface relative overflow-hidden text-on-table">
      <div aria-hidden className="table-vignette pointer-events-none absolute inset-0" />
      <div className={`relative mx-auto ${width} px-4 pb-12 pt-9 sm:pb-14 sm:pt-11`}>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-table-gold">{kicker}</p>
        <h1 className="mt-3.5 max-w-[760px] text-balance font-display text-[clamp(40px,6vw,76px)] font-bold leading-[0.95] tracking-[-0.045em]">{title}</h1>
        {sub && <p className="mt-4 max-w-[560px] text-pretty text-lg leading-relaxed text-on-table-muted">{sub}</p>}
        {children}
      </div>
    </section>
  );
}
