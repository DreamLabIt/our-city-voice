/**
 * The server-side door to the Express API.
 *
 * Only the Next.js server calls this. The browser never talks to the API
 * directly, which is the whole reason the session can live in httpOnly cookies:
 * there is no request from client JavaScript that would need to attach a token,
 * so no token is ever reachable from client JavaScript.
 *
 * INTERNAL_API_URL, not NEXT_PUBLIC_API_URL. Inside docker the API is reachable
 * as http://backend:4000, a name that does not resolve in a browser. Mixing the
 * two up is the classic version of this bug and it only shows up in the
 * container, never on the host.
 */

const API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:4000/api/v1";

export interface ApiError {
  code: string;
  message: string;
  /** field -> messages, present on validation failures. */
  details?: Record<string, string[]>;
  requestId?: string | null;
}

export type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: ApiError };

export interface ApiRequest {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** An access token to send as a bearer credential. */
  token?: string | undefined;
  /**
   * Headers passed straight through from the browser's request, so the API sees
   * the person rather than this server. See lib/client-headers.ts for why that
   * matters more than it sounds like it does.
   */
  forward?: Record<string, string> | undefined;
  signal?: AbortSignal;
}

/**
 * Never throws for an HTTP error, and never throws for a dead API either.
 *
 * A thrown exception inside a server action becomes a 500 and an empty page.
 * Returning a result forces the caller to decide what the user should see,
 * which for a sign-in form is a message next to the button.
 */
export async function apiFetch<T>(path: string, request: ApiRequest = {}): Promise<ApiResult<T>> {
  const { method = "GET", body, token, forward, signal } = request;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        // Before the explicit headers, so a forwarded value can never overwrite
        // the Authorization header or the content type.
        ...forward,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      // Auth responses are per-user and must not be cached. Next caches fetches
      // aggressively by default, and a cached /auth/me would show one person's
      // account to the next visitor.
      cache: "no-store",
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    // Container not up yet, DNS name wrong, connection refused.
    console.error(`[api] ${method} ${path} could not be reached`, cause);
    return {
      ok: false,
      status: 503,
      error: {
        code: "API_UNREACHABLE",
        message: "Cannot reach the server right now. Please try again.",
      },
    };
  }

  if (response.status === 204) {
    return { ok: true, status: 204, data: undefined as T };
  }

  const text = await response.text();
  let payload: unknown = undefined;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      // An HTML error page from a proxy, most likely.
      payload = undefined;
    }
  }

  if (!response.ok) {
    const envelope = (payload as { error?: ApiError } | undefined)?.error;
    return {
      ok: false,
      status: response.status,
      error: envelope ?? {
        code: "UNKNOWN",
        message: `Request failed with status ${response.status}`,
      },
    };
  }

  return { ok: true, status: response.status, data: payload as T };
}
