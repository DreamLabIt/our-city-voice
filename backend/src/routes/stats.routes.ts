import { Router } from "express";

import * as statsController from "../controllers/stats.controller.js";
import { requireAuth, requireSuperAdmin } from "../middleware/authenticate.js";

export const statsRouter: Router = Router();

// Public: the statistics page and the landing page's activity panel read these
// without an account, exactly as they read reports.
statsRouter.get("/", statsController.platform);

statsRouter.get("/activity", statsController.activity);

// A signed-in person's own reports: the same shape as the public one, scoped.
statsRouter.get("/me", requireAuth, statsController.me);

// The admin dashboard's landing payload. Super admin only, like /users and the
// contact inbox.
statsRouter.get("/admin", requireAuth, requireSuperAdmin, statsController.admin);
