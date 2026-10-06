import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/session-cookies";

/**
 * Route guarding, and the one place a session gets refreshed.
 *
 * This is what used to be middleware.ts. Next 16 renamed the convention to
 * proxy.ts and the exported function to `proxy`; the API is otherwise the same,
 * and the old name now logs a deprecation warning on every boot.
 *
 * It is the only part of the app that runs before a page and can still write
 * cookies. A server component cannot, so if refreshing happened there the new
 * token would be used once and thrown away, and every single request would
 * refresh again.
 *
 * It runs on the routes in the matcher at the bottom and nowhere else. Running
 * it everywhere would put a fetch to the API in front of the landing page for
 * no benefit, since nothing public needs to know who is reading.
 */

const LOGIN_PATH = "/login";
const DASHBOARD_PATH = "/dashboard";

/** Mirrors lib/api.ts, which cannot be imported here: it is not edge-safe. */
const API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api/v1";

function redirectTo(path: string, request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = path;
  url.search = "";
  return NextResponse.redirect(url);
}

/** Sends them back where they were going once they have signed in. */
function redirectToLogin(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  if (request.nextUrl.pathname !== DASHBOARD_PATH) {
    url.searchParams.set("next", request.nextUrl.pathname);
  }

  const response = NextResponse.redirect(url);
  // Clear both, so a stale refresh token cannot bounce the browser between
  // /login and /dashboard forever. Without this, the auth-page rule in proxy()
  // would see a refresh cookie, send them to the dashboard, and land back here.
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  const isAuthPage = pathname === LOGIN_PATH || pathname === "/register";

  if (isAuthPage) {
    // Presence only, no round trip. If the token turns out to be dead, the
    // dashboard's own check below cleans up and sends them back.
    return refreshToken ? redirectTo(DASHBOARD_PATH, request) : NextResponse.next();
  }

  if (accessToken) return NextResponse.next();
  if (!refreshToken) return redirectToLogin(request);

  // The access cookie has expired and been dropped by the browser, but the
  // longer-lived refresh cookie is still here. Trade it for a new pair.
  let payload: SessionPayload;
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // So the rotated row records the browser rather than this server. Same
        // reasoning as lib/client-headers.ts, which cannot be used here: it
        // reads next/headers, which the edge runtime does not allow.
        ...(request.headers.get("user-agent")
          ? { "user-agent": request.headers.get("user-agent") as string }
          : {}),
        ...(request.headers.get("x-forwarded-for")
          ? { "x-forwarded-for": request.headers.get("x-forwarded-for") as string }
          : {}),
      },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });

    if (!response.ok) return redirectToLogin(request);
    payload = (await response.json()) as SessionPayload;
  } catch {
    // The API is down. Sending them to the login page is wrong (they are signed
    // in) but it is the only honest option: the page behind this needs a token.
    return redirectToLogin(request);
  }

  // Setting the cookie on the *request* as well as the response is what makes
  // the new token visible to the page being rendered right now. Without it the
  // page still sees no access cookie, calls /auth/me without one, and renders as
  // though nobody is signed in, even though the browser now holds a good token.
  request.cookies.set(ACCESS_COOKIE, payload.accessToken);
  request.cookies.set(REFRESH_COOKIE, payload.refreshToken);

  const response = NextResponse.next({ request });
  response.cookies.set(
    ACCESS_COOKIE,
    payload.accessToken,
    sessionCookieOptions(payload.accessTokenExpiresAt),
  );
  response.cookies.set(
    REFRESH_COOKIE,
    payload.refreshToken,
    sessionCookieOptions(payload.refreshTokenExpiresAt),
  );

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
