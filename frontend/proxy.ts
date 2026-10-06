import { NextResponse, type NextRequest } from "next/server";

import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  sessionCookieOptions,
  type SessionPayload,
} from "@/lib/session-cookies";

/**
 * Keeps the session alive, and keeps signed-in people off the auth pages.
 *
 * This is what used to be middleware.ts. Next 16 renamed the convention to
 * proxy.ts and the exported function to `proxy`; the API is otherwise the same.
 *
 * It guards nothing, because nothing is behind a login yet. What it does is
 * refresh, and it is the only place that can: it is the only part of the app
 * that runs before a page and can still write a cookie. A server component
 * cannot, so refreshing there would mean using a new token once and throwing it
 * away on every request.
 *
 * It runs on every page rather than a short list, which is a change from when
 * there was a dashboard to protect. The access cookie lasts about fifteen
 * minutes and the refresh cookie lasts a month, so without this a reader who
 * stayed on public pages would watch the navbar quietly revert to a Login button
 * while they were still perfectly signed in.
 *
 * For an anonymous visitor this is two cookie reads and nothing else.
 */

const HOME_PATH = "/";
/**
 * Pages a signed-in person has no use for. Deliberately not /forgot-password:
 * that is reachable while signed in, and bouncing somebody away from it is the
 * sort of thing that is only noticed by whoever needed it.
 */
const AUTH_PATHS = new Set(["/login", "/register"]);

/** Mirrors lib/api.ts, which cannot be imported here: it is not edge-safe. */
const API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api/v1";

function redirectHome(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = HOME_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}

/** Carries on to the page, with both cookies dropped. */
function continueSignedOut(request: NextRequest): NextResponse {
  request.cookies.delete(ACCESS_COOKIE);
  request.cookies.delete(REFRESH_COOKIE);

  const response = NextResponse.next({ request });
  response.cookies.delete(ACCESS_COOKIE);
  response.cookies.delete(REFRESH_COOKIE);
  return response;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    // Nothing to refresh from. An access cookie without a refresh cookie means
    // a sign-out that half completed, so clear it rather than leaving a token
    // that will look like a session until it expires.
    return accessToken ? continueSignedOut(request) : NextResponse.next();
  }

  // Signed in, and asking for a sign-in form.
  if (AUTH_PATHS.has(pathname) && accessToken) return redirectHome(request);

  if (accessToken) return NextResponse.next();

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

    // Revoked, expired, or replayed. Drop the cookies and show the page as it
    // looks to anybody else, rather than bouncing somebody off a public page
    // over an expired session.
    if (!response.ok) return continueSignedOut(request);
    payload = (await response.json()) as SessionPayload;
  } catch {
    // The API is unreachable. Rendering signed-out is wrong but harmless here,
    // and it is the only option: the page cannot be told who is reading.
    return continueSignedOut(request);
  }

  if (AUTH_PATHS.has(pathname)) {
    const response = redirectHome(request);
    setSession(response, payload);
    return response;
  }

  // Setting the cookie on the *request* as well as the response is what makes
  // the new token visible to the page being rendered right now. Without it the
  // layout still sees no access cookie, renders a Login button, and only the
  // next navigation picks up the session.
  request.cookies.set(ACCESS_COOKIE, payload.accessToken);
  request.cookies.set(REFRESH_COOKIE, payload.refreshToken);

  const response = NextResponse.next({ request });
  setSession(response, payload);
  return response;
}

function setSession(response: NextResponse, payload: SessionPayload): void {
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
}

export const config = {
  /**
   * Every page, plus the upload signature route, which also reads the session.
   *
   * Excluded: Next's own build output and anything that looks like a static
   * file. Running a cookie check and a possible API call in front of every image
   * and font request would be pure overhead.
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|avif|ico|mp4|webm|woff2?)$).*)",
  ],
};
