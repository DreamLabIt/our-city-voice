import { Router } from "express";

import { env } from "../config/env.js";
import * as profileController from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const profileRouter: Router = Router();

/**
 * The signed-in account's own record, at /api/v1/me.
 *
 * A path of its own rather than a route inside user.routes.ts, which is super
 * admin only from its first line and relies on that being true of every route
 * in the file. Putting /users/me there would have meant carving an exception out
 * of that guard, and it would have had to be declared above `GET /users/:id` or
 * be swallowed by it, with "me" arriving as an id.
 *
 * No role check. Every route here acts on whoever is holding the token, so
 * being signed in is the whole of the authorisation.
 */
profileRouter.use(requireAuth);

/** GET /api/v1/me - the signed-in account, read fresh from the database. */
profileRouter.get("/", profileController.get);

/**
 * PATCH /api/v1/me - change your own name, email, phone or avatar.
 *
 * Limited, loosely. Changing the email address requires the current password,
 * which makes this the one authenticated endpoint where guessing has a prize:
 * somebody holding a stolen session could otherwise test passwords here without
 * limit and go on to try them somewhere else.
 *
 * Deliberately far above AUTH_RATE_LIMIT_MAX. The limiter counts every response
 * at 400 or above, validation failures included, and a dozen tries at a form
 * should not lock somebody out of their own settings page. Twenty attempts per
 * window is useless for guessing and more than a person will ever reach.
 */
profileRouter.patch(
  "/",
  rateLimit({ name: "profile-update", max: 20, windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS }),
  profileController.update,
);
