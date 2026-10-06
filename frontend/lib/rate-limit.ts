/**
 * A fixed-window limiter for Next.js route handlers, in memory.
 *
 * Same caveats as the one in the API: per process, forgotten on restart, and
 * reset by every hot reload in development. It is here because
 * /api/uploads/signature hands out a credential for writing to a paid Cloudinary
 * account and has to answer before anybody has an account, so it cannot be
 * behind a session check. Something is better than nothing.
 *
 * If this app is ever run as more than one instance, this needs to move to the
 * API, which is where the real limiter lives.
 */

interface Window {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Window>();
let lastSweep = 0;

/** Lazy, so no timer is held open in a serverless environment. */
function sweep(now: number): void {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitVerdict {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function consume(key: string, max: number, windowMs: number): RateLimitVerdict {
  const now = Date.now();
  sweep(now);

  const window = buckets.get(key);

  if (!window || window.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  window.count += 1;

  if (window.count > max) {
    return { allowed: false, retryAfterSeconds: Math.ceil((window.resetAt - now) / 1000) };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Best effort. Behind nginx this is the client; with no proxy in front it is
 * absent and everybody shares one bucket, which is the safe direction to fail.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
