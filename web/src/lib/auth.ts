import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";

const COOKIE = "ttc_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

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

export async function isAdmin(): Promise<boolean> {
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

/** Call at the top of every mutating server action. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not signed in as admin");
}
