import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { mediaUrlSchema } from "../lib/media-url.js";
import { emailSchema, nameSchema, phoneSchema } from "../lib/user-fields.js";
import { parseBody } from "../lib/validate.js";
import * as profileService from "../services/profile.service.js";

const clearable = <T extends z.ZodType>(schema: T) => schema.nullable().optional();

const UpdateProfileSchema = z
  .strictObject({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    phone: clearable(phoneSchema),
    avatarUrl: clearable(mediaUrlSchema),
    
    currentPassword: z.string().min(1, "Enter your current password").optional(),
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.email !== undefined ||
      body.phone !== undefined ||
      body.avatarUrl !== undefined,
    {
      error: "Send at least one of: name, email, phone, avatarUrl",
      path: ["_"],
    },
  );

export async function get(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const user = await profileService.getProfile(req.user.id);
  res.status(200).json({ user });
}

export async function update(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const input = parseBody(UpdateProfileSchema, req.body ?? {});
  const user = await profileService.updateProfile(req.user.id, input);

  res.status(200).json({ user });
}