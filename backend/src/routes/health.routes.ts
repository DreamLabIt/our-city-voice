import { Router } from "express";

import * as healthController from "../controllers/health.controller.js";

export const healthRouter: Router = Router();

healthRouter.get("/", healthController.live);

healthRouter.get("/ready", healthController.ready);