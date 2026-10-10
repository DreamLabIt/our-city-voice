import { Router } from "express";

import * as postController from "../controllers/post.controller.js";
import { optionalAuth, requireAuth } from "../middleware/authenticate.js";

export const postRouter: Router = Router();

postRouter.use(optionalAuth);

postRouter.get("/filters", postController.filters);

postRouter.get("/", postController.list);

postRouter.post("/", requireAuth, postController.create);

postRouter.get("/:code", postController.detail);

postRouter.get("/:code/comments", postController.comments);