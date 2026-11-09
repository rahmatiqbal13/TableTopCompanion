import "server-only";
import { eq, sql } from "drizzle-orm";
import { db, hasDatabase } from "./db/client";
import * as schema from "./db/schema";
import { currentUser, type SessionUser } from "./supabase/server";

export type Role = "user" | "editor" | "admin";
export type Profile = typeof schema.profiles.$inferSelect;

/** Emails (comma-separated in ADMIN_EMAILS) that become admin on sign-in. */
const adminEmails = () =>
  new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean));

/** Creates or refreshes the profile for a signed-in user. */
export async function ensureProfile(user: SessionUser): Promise<Profile | null> {
  if (!hasDatabase) return null;
  const makeAdmin = user.email !== null && adminEmails().has(user.email.toLowerCase());
  const [row] = await db().insert(schema.profiles)
    .values({ id: user.id, email: user.email, displayName: user.name, avatarUrl: user.avatar, role: makeAdmin ? "admin" : "user" })
    .onConflictDoUpdate({
      target: schema.profiles.id,
      set: {
        email: user.email,
        avatarUrl: user.avatar,
        // Keep a name the user may have set; fill it only when empty.
        displayName: sql`coalesce(${schema.profiles.displayName}, ${user.name})`,
        ...(makeAdmin ? { role: "admin" as const } : {}),
      },
    })
    .returning();
  return row ?? null;
}

/** Signed-in user and profile, or null. Creates the profile on first use. */
export async function currentAccount(): Promise<{ user: SessionUser; profile: Profile } | null> {
  const user = await currentUser();
  if (!user || !hasDatabase) return null;
  const [found] = await db().select().from(schema.profiles).where(eq(schema.profiles.id, user.id));
  const profile = found ?? (await ensureProfile(user));
  return profile ? { user, profile } : null;
}

const rank: Record<Role, number> = { user: 0, editor: 1, admin: 2 };
export const hasRole = (p: Profile | null | undefined, role: Role) => Boolean(p && !p.banned && rank[p.role] >= rank[role]);
