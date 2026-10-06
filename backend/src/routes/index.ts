import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";

/**
 * Every module router gets mounted here, and this is mounted at /api/v1.
 * Versioning the prefix from day one costs nothing and means a breaking
 * change later does not require breaking the deployed frontend.
 */
export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);

// Coming next:
// apiRouter.use("/users", usersRouter);
// apiRouter.use("/posts", postsRouter);
// apiRouter.use("/categories", categoriesRouter);
// apiRouter.use("/wards", wardsRouter);
// apiRouter.use("/stats", statsRouter);
// apiRouter.use("/contact-messages", contactMessagesRouter);
