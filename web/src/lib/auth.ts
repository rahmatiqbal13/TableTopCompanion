import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { currentAccount, hasRole } from "./account";

const COOKIE = "ttc_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

/** The shared admin password is set up (accounts with roles work independently of this). */
export const adminConfigured = Boolean(process.env.ADMIN_PASSWORD && (process.env.SESSION_SECRET?.length ?? 0) >= 32);

const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);
const digest = (s: string) => createHash("sha256").update(s).digest();

export function passwordMatches(input: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!adminConfigured || !expected) return false;
  return timingSafeEqual(digest(input), digest(expected));
}

export async function startSession() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** The shared-password session (kept as a backup way in). */
async function passwordSession(): Promise<boolean> {
  // Read the cookie before any early return: this is what marks the caller as
  // request-time. Returning first would let Next.js prerender "signed out".
  const token = (await cookies()).get(COOKIE)?.value;
  if (!adminConfigured || !token) return false;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/** Full admin: the shared password, or a signed-in account with the admin role. */
export async function isAdmin(): Promise<boolean> {
  if (await passwordSession()) return true;
  return hasRole((await currentAccount())?.profile, "admin");
}

/** Can write posts: admins, plus accounts with the editor role. */
export async function canEdit(): Promise<boolean> {
  if (await passwordSession()) return true;
  return hasRole((await currentAccount())?.profile, "editor");
}

/** Call at the top of every catalog/user-management server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in as admin");
}

/** Call at the top of every post server action. */
export async function requireEditor() {
  if (!(await canEdit())) throw new Error("Not signed in as editor");
}
