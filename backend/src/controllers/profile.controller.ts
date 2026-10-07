import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { mediaUrlSchema } from "../lib/media-url.js";
import { emailSchema, nameSchema, phoneSchema } from "../lib/user-fields.js";
import { parseBody } from "../lib/validate.js";
import * as profileService from "../services/profile.service.js";

/**
 * The HTTP edge of "my own account". Reads the request, calls the service,
 * picks a status code.
 */

/**
 * Nullable so a field can be cleared, optional so it can be left alone, and the
 * two are not the same request. `{ "phone": null }` removes a number;
 * `{}` with no phone key keeps it.
 */
const clearable = <T extends z.ZodType>(schema: T) => schema.nullable().optional();

/**
 * strictObject, so an unknown key is a 400 rather than silently dropped.
 *
 * Both halves of that matter. A body containing "role" gets told no, instead of
 * appearing to succeed while the field goes nowhere. And a field the database
 * has no column for, which a form might plausibly send, fails loudly at
 * integration time rather than quietly discarding something a person typed.
 */
const UpdateProfileSchema = z
  .strictObject({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    phone: clearable(phoneSchema),
    avatarUrl: clearable(mediaUrlSchema),
    /**
     * Not a new password, and no minimum length. This confirms the password the
     * account already has, and it is only consulted when the email address is
     * actually changing: the service compares against the stored address first.
     * See profile.service.ts.
     */
    currentPassword: z.string().min(1, "Enter your current password").optional(),
    // No `role`, no `departmentId`. Absent from the schema rather than stripped
    // later, so there is no code path where a request body reaches either one.
  })
  .refine(
    (body) =>
      body.name !== undefined ||
      body.email !== undefined ||
      body.phone !== undefined ||
      body.avatarUrl !== undefined,
    {
      // currentPassword on its own is not a change, and treating it as one would
      // make an empty save look like it did something.
      error: "Send at least one of: name, email, phone, avatarUrl",
      path: ["_"],
    },
  );

export async function get(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees this. The non-null assertion would be a lie the day
  // somebody mounts this route without it.
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
