import type { Request, Response } from "express";

import { AppError } from "../lib/errors.js";
import * as statsService from "../services/stats.service.js";

export async function platform(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ stats: await statsService.buildReportStatistics() });
}

export async function activity(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ activity: await statsService.getActivitySummary() });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  res.status(200).json({ stats: await statsService.buildReportStatistics(req.user.id) });
}

export async function admin(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await statsService.getAdminOverview());
}
