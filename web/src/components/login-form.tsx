"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { fmt, type Dict } from "@/i18n";
import { supabaseBrowser } from "@/lib/supabase/browser";

const safeNext = (raw: string | null, fallback: string) => (raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback);

export function LoginForm({ t, home }: { t: Dict; home: string }) {
  const params = useSearchParams();
  const next = safeNext(params.get("next"), home);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(params.get("error") ? "error" : "idle");
  const sb = supabaseBrowser();
  if (!sb) return <p className="rounded-xl bg-sunken p-4 text-sm text-muted">{t.auth.unavailable}</p>;
  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  return (
    <div className="space-y-5">
      {state === "error" && <p role="alert" className="rounded-xl bg-meeple-soft p-3 text-sm">{t.auth.error}</p>}
      <button type="button"
        onClick={() => sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo() } })}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-card px-4 py-3 font-medium hover:bg-sunken">
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.5z" />
          <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.5z" />
        </svg>
        {t.auth.google}
      </button>
      <div className="flex items-center gap-3 text-xs text-muted"><span className="h-px flex-1 bg-line" />{t.auth.or}<span className="h-px flex-1 bg-line" /></div>
      {state === "sent" ? (
        <p role="status" className="rounded-xl bg-felt-soft p-4 text-sm">{fmt(t.auth.sent, { email })}</p>
      ) : (
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          setState("sending");
          const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectTo() } });
          setState(error ? "error" : "sent");
        }}>
          <label className="block text-sm font-medium">{t.auth.email}
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2" />
          </label>
          <button disabled={state === "sending"} className="w-full rounded-xl bg-felt px-4 py-3 font-medium text-on-felt disabled:opacity-60">
            {state === "sending" ? t.auth.sending : t.auth.sendLink}
          </button>
        </form>
      )}
      <p className="text-xs text-muted">{t.auth.privacy}</p>
    </div>
  );
}
