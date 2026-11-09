"use server";

import { and, desc, eq } from "drizzle-orm";
import { updateTag } from "next/cache";
import { z } from "zod";
import { currentAccount } from "@/lib/account";
import { CATALOG_TAG } from "@/lib/data";
import { db } from "@/lib/db/client";
import * as schema from "@/lib/db/schema";

export interface MyAccount {
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "editor" | "admin";
  banned: boolean;
}

/** The signed-in user's account, or null. Called from the browser so pages stay cacheable. */
export async function getMyAccount(): Promise<MyAccount | null> {
  const a = await currentAccount();
  if (!a) return null;
  return { name: a.profile.displayName, email: a.user.email, avatar: a.profile.avatarUrl, role: a.profile.role, banned: a.profile.banned };
}

export interface MyGame {
  rating: number | null;
  played: boolean;
  own: boolean;
  wishlist: boolean;
}
const EMPTY: MyGame = { rating: null, played: false, own: false, wishlist: false };

/** Your rating and shelf for one game; null when signed out. */
export async function getMyGame(gameId: number): Promise<MyGame | null> {
  const a = await currentAccount();
  if (!a || !Number.isInteger(gameId)) return null;
  const [row] = await db().select().from(schema.userGames)
    .where(and(eq(schema.userGames.userId, a.user.id), eq(schema.userGames.gameId, gameId)));
  return row ? { rating: row.rating, played: row.played, own: row.own, wishlist: row.wishlist } : EMPTY;
}

const patchSchema = z.object({
  rating: z.number().int().min(1).max(10).nullable().optional(),
  played: z.boolean().optional(),
  own: z.boolean().optional(),
  wishlist: z.boolean().optional(),
});

export async function updateMyGame(gameId: number, patch: z.input<typeof patchSchema>): Promise<{ ok: boolean; state?: MyGame; error?: "signin" | "banned" | "invalid" }> {
  const a = await currentAccount();
  if (!a) return { ok: false, error: "signin" };
  if (a.profile.banned) return { ok: false, error: "banned" };
  const p = patchSchema.safeParse(patch);
  if (!p.success || !Number.isInteger(gameId) || gameId <= 0) return { ok: false, error: "invalid" };

  const current = (await getMyGame(gameId)) ?? EMPTY;
  const next: MyGame = { ...current, ...p.data };
  const where = and(eq(schema.userGames.userId, a.user.id), eq(schema.userGames.gameId, gameId));
  if (next.rating === null && !next.played && !next.own && !next.wishlist) {
    await db().delete(schema.userGames).where(where);
  } else {
    // Rating a game means you played it.
    if (p.data.rating != null) next.played = true;
    await db().insert(schema.userGames).values({ userId: a.user.id, gameId, ...next })
      .onConflictDoUpdate({ target: [schema.userGames.userId, schema.userGames.gameId], set: { ...next, updatedAt: new Date() } });
  }
  // Community averages live in the cached catalog.
  if (p.data.rating !== undefined && p.data.rating !== current.rating) updateTag(CATALOG_TAG);
  return { ok: true, state: next };
}

export interface MyGameRow extends MyGame {
  gameId: number;
  updatedAt: string;
}

/** Everything on your shelf, newest first; null when signed out. */
export async function getMyGames(): Promise<MyGameRow[] | null> {
  const a = await currentAccount();
  if (!a) return null;
  const rows = await db().select().from(schema.userGames)
    .where(eq(schema.userGames.userId, a.user.id)).orderBy(desc(schema.userGames.updatedAt));
  return rows.map((r) => ({ gameId: r.gameId, rating: r.rating, played: r.played, own: r.own, wishlist: r.wishlist, updatedAt: r.updatedAt.toISOString() }));
}
