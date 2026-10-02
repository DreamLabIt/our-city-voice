import { Router } from "express";

import * as healthController from "./health.controller.js";

export const healthRouter: Router = Router();

/** GET /api/v1/health - liveness. Cheap, no dependencies. */
healthRouter.get("/", healthController.live);

/** GET /api/v1/health/ready - readiness. Pings Postgres, 503 when it is down. */
healthRouter.get("/ready", healthController.ready);
