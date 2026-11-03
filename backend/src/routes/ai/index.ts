import { Router } from "express";

import { duplicates, triage } from "../../controllers/ai/triage.controller.js";
import { optionalAuth } from "../../middleware/authenticate.js";

export const aiRouter = Router();

aiRouter.post("/triage", optionalAuth, triage);
aiRouter.post("/duplicates", optionalAuth, duplicates);
