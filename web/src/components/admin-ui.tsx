/* Small shared pieces of the admin look. Usable from server and client components. */

export const panel = "rounded-[18px] border border-line bg-card";
export const eyebrow = "font-mono text-xs uppercase tracking-[0.14em]";
export const h2 = "font-display text-[22px] font-semibold tracking-[-0.02em]";
export const field = "w-full rounded-xl border border-line bg-paper px-3.5 min-h-11 text-[15px] outline-none focus:border-felt";
export const pillPrimary = "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 font-medium text-paper transition-transform hover:bg-felt active:scale-[0.97] disabled:opacity-50";
export const pillAccent = "inline-flex min-h-11 items-center justify-center rounded-full bg-meeple px-5 text-sm font-semibold text-white transition-transform hover:opacity-90 active:scale-[0.97]";
export const pillGhost = "inline-flex min-h-11 items-center justify-center rounded-full border border-line px-[18px] text-sm transition-colors hover:bg-sunken active:scale-[0.97] disabled:opacity-50";
export const pillFelt = "inline-flex min-h-10 items-center justify-center rounded-full bg-table px-4 text-sm font-medium text-on-table transition-transform active:scale-[0.97]";

/** Filter chip: `on` is the selected look. */
export const chip = (on: boolean) =>
  `inline-flex min-h-10 items-center rounded-full border px-3.5 text-sm transition-colors ${on ? "border-ink bg-ink text-paper" : "border-line bg-card hover:bg-sunken"}`;

/** Two- or three-way pill switch segment. */
export const segment = (on: boolean) =>
  `rounded-full px-3 py-[5px] text-[13px] ${on ? "bg-ink text-paper" : "text-muted hover:text-ink"}`;

export const pct = (up: number, total: number) => (total ? `${Math.round((up / total) * 100)}%` : "–");

export function hueOf(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

const STATUS = {
  published: { label: "Terbit", cls: "bg-felt-soft text-felt" },
  draft: { label: "Draf", cls: "bg-sunken text-muted" },
};

export function StatusPill({ status }: { status: "draft" | "published" }) {
  const s = STATUS[status];
  return <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${s.cls}`}>{s.label}</span>;
}

/** Language badge: green when that translation exists. */
export function LangBadge({ code, ok }: { code: string; ok: boolean }) {
  return <span className={`rounded-[5px] px-1.5 py-0.5 font-mono text-[10px] font-semibold ${ok ? "bg-felt-soft text-felt" : "bg-meeple-soft text-meeple"}`}>{code}</span>;
}

/** A labelled bar; `tone` picks the fill. */
export function Bar({ value, tone = "bg-table" }: { value: string; tone?: string }) {
  return (
    <span className="block h-2.5 overflow-hidden rounded-full bg-sunken" aria-hidden>
      <span className={`block h-full rounded-full ${tone}`} style={{ width: value }} />
    </span>
  );
}
