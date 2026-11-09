import { NextResponse, type NextRequest } from "next/server";
import { ensureProfile } from "@/lib/account";
import { supabaseServer } from "@/lib/supabase/server";

/** Only same-site paths, so the link can't bounce users to another website. */
const safeNext = (raw: string | null) => (raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/");

/**
 * Where Google sign-in and email sign-in links return to. Exchanges the
 * one-time code for a session (stored in cookies) and creates the profile.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = safeNext(url.searchParams.get("next"));
  if (code) {
    const { data, error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const meta = data.user.user_metadata ?? {};
      await ensureProfile({
        id: data.user.id,
        email: data.user.email ?? null,
        name: meta.full_name ?? meta.name ?? null,
        avatar: meta.avatar_url ?? meta.picture ?? null,
      }).catch(() => null); // the profile is also created lazily on first use
      return NextResponse.redirect(new URL(next, url.origin));
    }
  }
  const lang = next.startsWith("/en") ? "en" : "id";
  return NextResponse.redirect(new URL(`/${lang}/login?error=1&next=${encodeURIComponent(next)}`, url.origin));
}
