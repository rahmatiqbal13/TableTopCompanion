import { currentAccount } from "@/lib/account";
import { adminConfigured } from "@/lib/auth";
import { authConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./admin-forms";
import { panel } from "./admin-ui";

/** Shown on admin pages to anyone without access: account sign-in, password, or setup help. */
export async function AdminSignIn({ next = "/admin" }: { next?: string }) {
  const account = await currentAccount();
  if (!adminConfigured && !authConfigured) return <SetupNotice />;
  return (
    <div className="mx-auto mt-10 max-w-sm space-y-4">
      {account && (
        <p role="status" className={`${panel} p-4 text-sm`}>
          Masuk sebagai <strong>{account.user.email ?? account.profile.displayName}</strong>, tetapi akun ini
          {account.profile.banned ? " diblokir." : " tidak punya akses ke halaman ini. Minta admin memberi peran."}
        </p>
      )}
      {authConfigured && !account && (
        <a href={`/id/login?next=${encodeURIComponent(next)}`}
          className={`${panel} block p-5 text-center text-sm font-medium hover:bg-sunken`}>
          Masuk dengan akunmu →
        </a>
      )}
      {adminConfigured && <LoginForm />}
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-6 text-sm leading-relaxed">
      <h1 className="font-display text-xl font-semibold">Admin belum disiapkan</h1>
      <p className="mt-2">Isi variabel lingkungan berikut (Vercel → Project → Settings → Environment Variables), lalu deploy ulang:</p>
      <ul className="mt-2 list-disc pl-5 font-mono text-xs">
        <li>NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY dan ADMIN_EMAILS (masuk dengan akun), dan/atau</li>
        <li>ADMIN_PASSWORD + SESSION_SECRET (minimal 32 karakter acak)</li>
        <li>DATABASE_URL (Supabase → Connect → Transaction pooler URI)</li>
      </ul>
    </div>
  );
}
