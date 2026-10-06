import { cache } from "react";
import { cookies } from "next/headers";

import { apiFetch } from "@/lib/api";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/session-cookies";
import type { AuthUser } from "@/types";

/**
 * The session, from the server's point of view.
 *
 * Two cookies rather than one. They have different lifetimes, and the access
 * cookie's absence is what tells proxy.ts that a refresh is due: an expired
 * cookie is a cookie the browser has already dropped, so there is nothing to
 * check and no clock to compare against.
 *
 * Writing cookies only works inside a server action or a route handler. Reading
 * works anywhere, which is why getCurrentUser is safe in a server component and
 * storeSession is not.
 */

export async function storeSession(payload: SessionPayload): Promise<void> {
  const jar = await cookies();

  jar.set(ACCESS_COOKIE, payload.accessToken, sessionCookieOptions(payload.accessTokenExpiresAt));
  jar.set(REFRESH_COOKIE, payload.refreshToken, sessionCookieOptions(payload.refreshTokenExpiresAt));
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  return (await cookies()).get(ACCESS_COOKIE)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  return (await cookies()).get(REFRESH_COOKIE)?.value;
}

/**
 * The signed-in account, or null.
 *
 * Asks the API rather than decoding the token. The token carries an id and a
 * role, which is enough to authorise but not enough to render: a name, an email
 * and an avatar all live in the row. Decoding would also mean trusting claims
 * that are up to fifteen minutes stale.
 *
 * Returns null instead of refreshing. A server component cannot set cookies, so
 * it has no way to save a new token even if it fetched one; refreshing is
 * proxy.ts's job, and by the time a protected page renders it has happened.
 *
 * Wrapped in React's cache(), which deduplicates it for the length of one
 * render. The dashboard layout and the page inside it both need the account, and
 * a layout cannot pass props to a page, so without this every protected page
 * costs two identical round trips.
 */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = await getAccessToken();
  if (!token) return null;

  const result = await apiFetch<{ user: AuthUser }>("/auth/me", { token });

  return result.ok ? result.data.user : null;
});
