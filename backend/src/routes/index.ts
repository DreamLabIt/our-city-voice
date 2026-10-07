import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { profileRouter } from "./profile.routes.js";
import { userRouter } from "./user.routes.js";

/**
 * Every module router gets mounted here, and this is mounted at /api/v1.
 * Versioning the prefix from day one costs nothing and means a breaking
 * change later does not require breaking the deployed frontend.
 */
export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
// The caller's own account. Signed in is the only requirement; see the note in
// profile.routes.ts for why this is not /users/me.
apiRouter.use("/me", profileRouter);
// Every route in here is super admin only; the guard is inside user.routes.ts.
apiRouter.use("/users", userRouter);

// Coming next:
// apiRouter.use("/posts", postsRouter);
// apiRouter.use("/categories", categoriesRouter);
// apiRouter.use("/wards", wardsRouter);
// apiRouter.use("/stats", statsRouter);
// apiRouter.use("/contact-messages", contactMessagesRouter);
