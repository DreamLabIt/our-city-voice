import { Router } from "express";

import * as postController from "../controllers/post.controller.js";
import { optionalAuth } from "../middleware/authenticate.js";

export const postRouter: Router = Router();

/**
 * Reports, at /api/v1/posts.
 *
 * optionalAuth, not requireAuth. The reports page is public and must answer a
 * signed-out visitor, but a signed-in one gets `likedByMe` filled in and may ask
 * for `mine=true`. Those are the same query with a viewer attached, so one
 * route serves both rather than a public copy and a private copy drifting apart.
 *
 * The role checks for authorId and includeDeleted are in the controller, where
 * the query string and the caller are both in scope.
 */
postRouter.use(optionalAuth);

/**
 * GET /api/v1/posts/filters - the option lists for the filter dropdowns.
 *
 * Above the list route only as a habit; `/filters` and `/` cannot collide. It
 * would matter the moment a `/:id` route lands, which would otherwise swallow
 * this one and try to read "filters" as an id.
 */
postRouter.get("/filters", postController.filters);

/** GET /api/v1/posts?page=&limit=&sort=&search=&category=&ward=&status=&priority=&mine= */
postRouter.get("/", postController.list);
