import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { parseBody } from "../lib/validate.js";
import * as userService from "../services/user.service.js";

/** Only values that exist in the enum, so a typo cannot create a third role. */
const roleSchema = z.enum(["user", "super_admin"]);

const ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  // Capped. An admin screen asking for limit=1000000 should not be able to pull
  // the whole table into memory.
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  role: roleSchema.optional(),
});

const UpdateRoleSchema = z.object({
  role: roleSchema,
});

/**
 * Ids are BigInt in the database and arrive as strings in the path. BigInt()
 * throws on anything that is not an integer literal, including "1.5", "0x10"
 * and "". The regex rejects those first so the message is about the id rather
 * than about a SyntaxError.
 */
function parseId(raw: string | string[] | undefined): bigint {
  // The string[] case comes from Express's param typing, which allows repeated
  // keys. A single `:id` segment cannot produce one, but narrowing here beats a
  // cast that claims it cannot happen.
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
