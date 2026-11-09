import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import type { NextRequest } from "next/server";
import { CATALOG_TAG, POSTS_TAG } from "@/lib/data";

/** Which cached data each table feeds. */
const TAGS: Record<string, string[]> = {
  games: [CATALOG_TAG], genres: [CATALOG_TAG], criteria: [CATALOG_TAG],
  user_games: [CATALOG_TAG], profiles: [CATALOG_TAG], posts: [POSTS_TAG],
};

const digest = (s: string) => createHash("sha256").update(s).digest();

/**
 * Called by Supabase Database Webhooks when a row changes, so edits made in
 * the Supabase Table Editor show up on the site right away.
 * Header: x-revalidate-secret: <REVALIDATE_SECRET>
 * Body (Supabase webhook payload): { "type": "UPDATE", "table": "games", ... }
 * Without a known table it clears everything.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.REVALIDATE_SECRET;
  const given = req.headers.get("x-revalidate-secret") ?? "";
  if (!expected || expected.length < 16 || !timingSafeEqual(digest(given), digest(expected))) {
    return Response.json({ ok: false }, { status: 401 });
  }
  let table = "";
  try {
    table = String(((await req.json()) as { table?: unknown }).table ?? "");
  } catch { /* empty or non-JSON body: clear everything */ }
  const tags = TAGS[table] ?? [CATALOG_TAG, POSTS_TAG];
  for (const tag of tags) revalidateTag(tag, { expire: 0 });
  return Response.json({ ok: true, revalidated: tags });
}
