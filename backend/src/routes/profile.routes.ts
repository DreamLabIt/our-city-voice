import { Router } from "express";

import { env } from "../config/env.js";
import * as profileController from "../controllers/profile.controller.js";
import { requireAuth } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const profileRouter: Router = Router();

profileRouter.use(requireAuth);

profileRouter.get("/", profileController.get);

profileRouter.patch(
  "/",
  rateLimit({ name: "profile-update", max: 20, windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS }),
  profileController.update,
);