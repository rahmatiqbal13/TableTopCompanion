/**
 * Supabase Auth settings. NEXT_PUBLIC_* values are public by design (the
 * publishable/anon key only allows what Row Level Security permits, and every
 * table here has RLS on with no policies). Both key names are accepted:
 * the Supabase ↔ Vercel integration sets NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** False until the Supabase URL and key are set; all account features hide themselves. */
export const authConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
