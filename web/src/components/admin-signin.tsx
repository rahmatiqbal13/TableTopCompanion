import { currentAccount } from "@/lib/account";
import { adminConfigured } from "@/lib/auth";
import { authConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./admin-forms";

/** Shown on admin pages to anyone without access: account sign-in, password, or setup help. */
export async function AdminSignIn({ next = "/admin" }: { next?: string }) {
  const account = await currentAccount();
  if (!adminConfigured && !authConfigured) return <SetupNotice />;
  return (
    <div className="mx-auto mt-10 max-w-sm space-y-4">
      {account && (
        <p role="status" className="rounded-xl border border-line bg-card p-4 text-sm">
          Signed in as <strong>{account.user.email ?? account.profile.displayName}</strong>, but this account
          {account.profile.banned ? " is blocked." : " has no access to this page. Ask an admin to give you a role."}
        </p>
      )}
      {authConfigured && !account && (
        <a href={`/en/login?next=${encodeURIComponent(next)}`}
          className="block rounded-2xl border border-line bg-card p-5 text-center text-sm font-medium hover:bg-sunken">
          Sign in with your account →
        </a>
      )}
      {adminConfigured && <LoginForm />}
    </div>
  );
}

function SetupNotice() {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-line bg-card p-6 text-sm leading-relaxed">
      <h1 className="font-display text-xl font-semibold">Admin is not configured</h1>
      <p className="mt-2">Set these environment variables (Vercel → Project → Settings → Environment Variables), then redeploy:</p>
      <ul className="mt-2 list-disc pl-5 font-mono text-xs">
        <li>NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY and ADMIN_EMAILS (sign in with your account), and/or</li>
        <li>ADMIN_PASSWORD + SESSION_SECRET (at least 32 random characters)</li>
        <li>DATABASE_URL (Supabase → Connect → Transaction pooler URI)</li>
      </ul>
    </div>
  );
}
