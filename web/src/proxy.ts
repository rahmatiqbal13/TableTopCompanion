import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, hasLocale, LOCALE_COOKIE, locales, type Locale } from "@/i18n";
import { authConfigured, SUPABASE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

/** Picks the visitor's language: saved choice, then browser preference, then Indonesian. */
function preferredLocale(req: NextRequest): Locale {
  const saved = req.cookies.get(LOCALE_COOKIE)?.value;
  if (saved && hasLocale(saved)) return saved;
  const accepted = (req.headers.get("accept-language") ?? "")
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { lang: tag.toLowerCase().split("-")[0], q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of accepted) if (hasLocale(lang)) return lang;
  return defaultLocale;
}

/**
 * Refreshes the Supabase session cookies (required by @supabase/ssr: server
 * components cannot write cookies). Only runs for visitors who are signed in,
 * so anonymous traffic pays nothing.
 */
async function refreshSession(req: NextRequest, res: NextResponse): Promise<NextResponse> {
  if (!authConfigured || !req.cookies.getAll().some((c) => c.name.startsWith("sb-"))) return res;
  let response = res;
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value } of list) req.cookies.set(name, value);
        response = NextResponse.next({ request: req });
        for (const { name, value, options } of list) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getClaims();
  return response;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const localized = locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`));
  if (!localized && !pathname.startsWith("/admin")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }
  return refreshSession(req, NextResponse.next({ request: req }));
}

export const config = {
  // Everything except Next internals, API and auth callback routes, and files with an extension.
  matcher: ["/((?!_next|api|auth|.*\\..*).*)"],
};
