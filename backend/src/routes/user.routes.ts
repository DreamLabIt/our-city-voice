import { Router } from "express";

import * as userController from "../controllers/user.controller.js";
import { requireAuth, requireSuperAdmin } from "../middleware/authenticate.js";

export const userRouter: Router = Router();

userRouter.use(requireAuth, requireSuperAdmin);

userRouter.get("/", userController.list);

userRouter.get("/:id", userController.detail);

userRouter.patch("/:id/role", userController.updateRole);