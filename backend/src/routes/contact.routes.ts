import { Router } from "express";

import { env } from "../config/env.js";
import * as contactController from "../controllers/contact.controller.js";
import { requireAuth, requireSuperAdmin } from "../middleware/authenticate.js";
import { rateLimit } from "../middleware/rate-limit.js";

export const contactRouter: Router = Router();

// Public: drives the contact form's category dropdown, so nobody has to hardcode
// category names or ids.
contactRouter.get("/categories", contactController.categories);

contactRouter.post(
  "/messages",
  rateLimit({
    name: "contact",
    max: env.CONTACT_RATE_LIMIT_MAX,
    windowMs: env.CONTACT_RATE_LIMIT_WINDOW_MS,
    countAll: true,
    message: "You have sent too many messages. Please try again later.",
  }),
  contactController.create,
);

// The dashboard inbox. Super admin only, like /users.
contactRouter.get("/messages", requireAuth, requireSuperAdmin, contactController.list);
