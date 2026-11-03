import type { Request, Response } from "express";

import { triageIssue } from "../../services/ai/triage.service.js";
import { findDuplicates } from "../../services/ai/duplicates.service.js";
import { parseBody } from "../../lib/validate.js";
import { z } from "zod";

const TriageSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
});

const DuplicatesSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  excludePostId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(10).optional(),
});

export async function triage(req: Request, res: Response): Promise<void> {
  const body = parseBody(TriageSchema, req.body);
  const result = await triageIssue(body);
  res.json({ suggestions: result });
}

export async function duplicates(req: Request, res: Response): Promise<void> {
  const body = parseBody(DuplicatesSchema, req.body);
  const excludePostId = body.excludePostId ? BigInt(body.excludePostId) : undefined;
  const result = await findDuplicates({
    title: body.title,
    description: body.description,
    excludePostId,
    limit: body.limit,
  });
  res.json({ duplicates: result });
}
