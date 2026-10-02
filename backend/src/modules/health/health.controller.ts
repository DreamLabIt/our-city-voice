import type { Request, Response } from "express";

import * as healthService from "./health.service.js";

/**
 * Controllers are the only layer that knows about HTTP. They read the request,
 * call a service, and choose a status code. No business logic, no database.
 */

export function live(_req: Request, res: Response): void {
  res.status(200).json(healthService.getLiveness());
}

export async function ready(_req: Request, res: Response): Promise<void> {
  const report = await healthService.getReadiness();
  res.status(report.status === "ok" ? 200 : 503).json(report);
}
