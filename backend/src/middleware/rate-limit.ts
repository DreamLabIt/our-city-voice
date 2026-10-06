import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../lib/errors.js";

/**
 * A fixed-window rate limiter, in memory.
 *
 * Scope, stated plainly: this is per process. Two API containers behind a load
 * balancer each allow the full quota, and a restart forgets everything. That is
 * fine for what it is here, which is making password guessing cost something
 * rather than being free. A real limit across replicas needs Redis, and there
 * is no Redis in this stack yet.
 *
 * It counts failures, not requests. Signing in correctly should never bring you
 * closer to being locked out, and a shared office NAT would otherwise burn
 * through the quota on legitimate traffic alone.
 */

interface Window {
  count: number;
  /** Epoch ms when the count resets. */
  resetAt: number;
}

export interface RateLimitOptions {
  /** Failures allowed inside one window. */
  max: number;
  windowMs: number;
  /** Keeps separate buckets per endpoint, so login and register do not share. */
  name: string;
}

const buckets = new Map<string, Window>();

/**
 * Without this the map grows one entry per IP, forever. Every sweep is O(size),
 * which is cheap next to never freeing the memory.
 */
const SWEEP_INTERVAL_MS = 60_000;
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS);
// Do not hold the event loop open. Without unref, the process will not exit.
sweep.unref();

export function rateLimit(options: RateLimitOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    // req.ip is only trustworthy because app.ts sets "trust proxy" to 1, which
    // reads exactly one hop of X-Forwarded-For. Trusting the whole header would
    // let a client spoof its own address and sidestep this entirely.
    const key = `${options.name}:${req.ip ?? "unknown"}`;
    const now = Date.now();

    const window = buckets.get(key);
    if (window && window.resetAt > now && window.count >= options.max) {
      const retryAfterSeconds = Math.ceil((window.resetAt - now) / 1000);
      res.setHeader("Retry-After", retryAfterSeconds);
      next(
        AppError.tooManyRequests(
          `Too many attempts. Try again in ${Math.ceil(retryAfterSeconds / 60)} minute(s).`,
        ),
      );
      return;
    }

    // Registered before the handler runs, because the handler may throw and the
    // error middleware is what writes the status code we want to inspect.
    res.on("finish", () => {
      if (res.statusCode < 400) return;

      const current = buckets.get(key);
      if (!current || current.resetAt <= Date.now()) {
        buckets.set(key, { count: 1, resetAt: Date.now() + options.windowMs });
        return;
      }
      current.count += 1;
    });

    next();
  };
}

/** Test helper. Nothing in the app should need to clear these. */
export function resetRateLimits(): void {
  buckets.clear();
}
