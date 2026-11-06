"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db, hasDatabase } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

const feedbackInput = z.object({
  sessionId: z.uuid(),
  gameId: z.number().int().positive(),
  /** 1 = good pick, -1 = not for me, 0 = take the vote back. */
  vote: z.union([z.literal(1), z.literal(-1), z.literal(0)]),
  rank: z.number().int().min(1).max(5000),
  score: z.number().min(0).max(1),
  query: z.string().max(1000),
  lang: z.enum(["id", "en"]),
});

// Per-instance throttle: plenty for a person, annoying for a script.
const recent = new Map<string, number[]>();
function throttled(sessionId: string): boolean {
  const now = Date.now();
  const hits = (recent.get(sessionId) ?? []).filter((t) => now - t < 60_000);
  hits.push(now);
  recent.set(sessionId, hits);
  if (recent.size > 10_000) recent.clear();
  return hits.length > 30;
}

/** Anonymous 👍/👎 on a recommendation. Silently ignored without a database. */
export async function sendFeedback(input: z.input<typeof feedbackInput>): Promise<{ ok: boolean }> {
  const parsed = feedbackInput.safeParse(input);
  if (!parsed.success || !hasDatabase || throttled(parsed.data.sessionId)) return { ok: false };
  const f = parsed.data;
  try {
    if (f.vote === 0) {
      await db().delete(schema.feedback)
        .where(and(eq(schema.feedback.sessionId, f.sessionId), eq(schema.feedback.gameId, f.gameId)));
    } else {
      const row = { ...f, rank: Math.min(f.rank, 32767), vote: f.vote };
      await db().insert(schema.feedback).values(row).onConflictDoUpdate({
        target: [schema.feedback.sessionId, schema.feedback.gameId],
        set: { vote: row.vote, rank: row.rank, score: row.score, query: row.query, lang: row.lang, createdAt: sql`now()` },
      });
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
