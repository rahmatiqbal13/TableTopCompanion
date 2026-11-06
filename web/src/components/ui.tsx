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
