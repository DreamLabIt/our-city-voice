import type { AuthUser } from "@/types";

/**
 * Cookie names and options, kept free of next/headers on purpose.
 *
 * proxy.ts runs in the edge runtime and sets cookies through NextResponse, while
 * server actions set them through cookies() from next/headers. Importing
 * next/headers into proxy.ts is not allowed, so anything both sides need has to
 * live in a module that imports neither.
 */

export const ACCESS_COOKIE = "ocv_access";
export const REFRESH_COOKIE = "ocv_refresh";

/** What the API returns from /auth/login, /auth/register and /auth/refresh. */
export interface SessionPayload {
  user: AuthUser;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface SessionCookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

/**
 * httpOnly         client JavaScript cannot read it, so an XSS bug cannot
 *                  exfiltrate the session
 * sameSite lax     not strict: strict would drop the cookie on a top-level
 *                  navigation from another site, so arriving from an email link
 *                  would look like being signed out
 * secure           https only, except in development where there is no https
 * path /           proxy.ts runs on several routes and all of them need it
 */
export function sessionCookieOptions(expiresAt: string): SessionCookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds(expiresAt),
  };
}

/**
 * Seconds from now until the token expires, as the API reported it.
 *
 * Derived rather than hardcoded, so changing ACCESS_TOKEN_TTL_MINUTES on the
 * API does not leave the cookie outliving the token it holds. Floored at zero
 * because a negative maxAge means "delete this cookie", which would sign
 * somebody out over a few seconds of clock drift.
 */
function maxAgeSeconds(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(0, Math.floor(ms / 1000)) : 0;
}
