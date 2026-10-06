import { Router } from "express";

import { env } from "../config/env.js";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const authRouter: Router = Router();

/** Separate bucket per endpoint, so a burst of refreshes cannot lock out login. */
function limit(name: string, max: number) {
  return rateLimit({ name, max, windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS });
}

/**
 * POST /api/v1/auth/register - create an account and sign in.
 *
 * Worth being clear about what this limit does and does not do. The limiter
 * counts failures, so it slows somebody probing for which emails are already
 * taken, and it does nothing at all about a script creating a thousand valid
 * accounts, because those all succeed.
 *
 * Mass signup is a different problem with a different answer: email
 * verification, which nothing implements yet. The emailVerifiedAt column exists
 * and is read by nothing.
 */
authRouter.post("/register", limit("register", env.AUTH_RATE_LIMIT_MAX), authController.register);

/** POST /api/v1/auth/login */
authRouter.post("/login", limit("login", env.AUTH_RATE_LIMIT_MAX), authController.login);

/**
 * POST /api/v1/auth/refresh - trade a refresh token for a new pair.
 *
 * A looser limit than login. The limiter only counts failures, and a failure
 * here is usually a stale tab retrying rather than an attack, since guessing a
 * 256-bit token is not a thing that happens.
 */
authRouter.post("/refresh", limit("refresh", 30), authController.refresh);

/** POST /api/v1/auth/logout - revoke one refresh token. Needs no access token. */
authRouter.post("/logout", authController.logout);

/** POST /api/v1/auth/logout-all - revoke every session for the caller. */
authRouter.post("/logout-all", requireAuth, authController.logoutEverywhere);

/** GET /api/v1/auth/me - the signed-in account, read fresh from the database. */
authRouter.get("/me", requireAuth, authController.me);
