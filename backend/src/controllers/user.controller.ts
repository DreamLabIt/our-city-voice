import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { parseBody } from "../lib/validate.js";
import * as userService from "../services/user.service.js";

const roleSchema = z.enum(["user", "super_admin"]);

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  role: roleSchema.optional(),
});

const UpdateRoleSchema = z.object({
  role: roleSchema,
});

function parseId(raw: string | string[] | undefined): bigint {
  if (typeof raw !== "string" || !/^\d+$/.test(raw)) {
    throw AppError.badRequest("User id must be a positive integer");
  }
  return BigInt(raw);
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseBody(ListQuerySchema, req.query);
  const result = await userService.listUsers(query);

  res.status(200).json(result);
}

export async function detail(req: Request, res: Response): Promise<void> {
  const user = await userService.getUser(parseId(req.params.id));
  res.status(200).json({ user });
}

export async function updateRole(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const { role } = parseBody(UpdateRoleSchema, req.body);
  const user = await userService.updateUserRole(req.user.id, parseId(req.params.id), role);

  res.status(200).json({ user });
}