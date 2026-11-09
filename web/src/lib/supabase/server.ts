import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authConfigured, SUPABASE_KEY, SUPABASE_URL } from "./config";

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a server component: cookies are read-only there; proxy.ts refreshes them.
        }
      },
    },
  });
}

export interface SessionUser {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
}

/** The signed-in user, verified (getClaims checks the JWT), or null. */
export async function currentUser(): Promise<SessionUser | null> {
  const store = await cookies(); // read first: marks the caller as request-time
  if (!authConfigured || !store.getAll().some((c) => c.name.startsWith("sb-"))) return null;
  const { data, error } = await (await supabaseServer()).auth.getClaims();
  const c = data?.claims;
  if (error || !c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" && v ? v : null);
  return {
    id: c.sub,
    email: str(c.email),
    name: str(meta.full_name) ?? str(meta.name),
    avatar: str(meta.avatar_url) ?? str(meta.picture),
  };
}
