import { Router } from "express";

import * as userController from "../controllers/user.controller.js";
import { requireAuth, requireSuperAdmin } from "../middleware/authenticate.js";

export const userRouter: Router = Router();

/**
 * Every route below is super admin only.
 *
 * The guard is applied with router.use rather than repeated per route on
 * purpose: adding a route to this file cannot accidentally ship it unguarded.
 *
 * Order matters. requireAuth populates req.user, requireSuperAdmin reads it.
 */
userRouter.use(requireAuth, requireSuperAdmin);

/** GET /api/v1/users?page=&limit=&search=&role= */
userRouter.get("/", userController.list);

/** GET /api/v1/users/:id */
userRouter.get("/:id", userController.detail);

/** PATCH /api/v1/users/:id/role  { "role": "user" | "super_admin" } */
userRouter.patch("/:id/role", userController.updateRole);
