import { Router } from "express";

import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { postRouter } from "./post.routes.js";
import { profileRouter } from "./profile.routes.js";
import { userRouter } from "./user.routes.js";

export const apiRouter: Router = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/me", profileRouter);
apiRouter.use("/posts", postRouter);
apiRouter.use("/users", userRouter);
