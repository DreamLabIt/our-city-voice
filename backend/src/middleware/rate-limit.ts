import type { NextFunction, Request, RequestHandler, Response } from "express";

import { AppError } from "../lib/errors.js";

interface Window {
  count: number;
  
  resetAt: number;
}

export interface RateLimitOptions {
  
  max: number;
  windowMs: number;
  
  name: string;
}

const buckets = new Map<string, Window>();

const SWEEP_INTERVAL_MS = 60_000;
const sweep = setInterval(() => {
  const now = Date.now();
  for (const [key, window] of buckets) {
    if (window.resetAt <= now) buckets.delete(key);
  }
}, SWEEP_INTERVAL_MS);
sweep.unref();

export function rateLimit(options: RateLimitOptions): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
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

export function resetRateLimits(): void {
  buckets.clear();
}