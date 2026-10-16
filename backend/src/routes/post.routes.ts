import { Router } from "express";

import * as postController from "../controllers/post.controller.js";
import { optionalAuth, requireAuth, requireSuperAdmin } from "../middleware/authenticate.js";

export const postRouter: Router = Router();

postRouter.use(optionalAuth);

postRouter.get("/filters", postController.filters);

// Registered before "/:code" so these static paths are not read as a tracking
// code. Both are lower-case and a code is "OCV-…", so they could never collide.
postRouter.get("/search", postController.search);

postRouter.get("/suggestions", postController.suggestions);

postRouter.get("/", postController.list);

postRouter.post("/", requireAuth, postController.create);

postRouter.get("/:code", postController.detail);

postRouter.patch("/:code", requireAuth, postController.update);

postRouter.patch("/:code/status", requireAuth, requireSuperAdmin, postController.updateStatus);

postRouter.delete("/:code", requireAuth, postController.remove);

postRouter.get("/:code/comments", postController.comments);

postRouter.post("/:code/comments", requireAuth, postController.addComment);

postRouter.post("/:code/comments/:commentId/replies", requireAuth, postController.addReply);

postRouter.post("/:code/comments/:commentId/like", requireAuth, postController.likeComment);

postRouter.delete("/:code/comments/:commentId/like", requireAuth, postController.unlikeComment);

postRouter.post("/:code/like", requireAuth, postController.like);

postRouter.delete("/:code/like", requireAuth, postController.unlike);