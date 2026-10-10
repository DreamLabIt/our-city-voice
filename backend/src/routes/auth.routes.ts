import { Router } from "express";

import { env } from "../config/env.js";
import * as authController from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const authRouter: Router = Router();

function limit(name: string, max: number) {
  return rateLimit({ name, max, windowMs: env.AUTH_RATE_LIMIT_WINDOW_MS });
}

authRouter.post("/register", limit("register", env.AUTH_RATE_LIMIT_MAX), authController.register);

authRouter.post("/login", limit("login", env.AUTH_RATE_LIMIT_MAX), authController.login);

authRouter.post("/refresh", limit("refresh", 30), authController.refresh);

authRouter.post("/logout", authController.logout);

authRouter.post("/logout-all", requireAuth, authController.logoutEverywhere);

authRouter.get("/me", requireAuth, authController.me);