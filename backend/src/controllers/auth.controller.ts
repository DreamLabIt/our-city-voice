import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { mediaUrlSchema } from "../lib/media-url.js";
import { parseBody } from "../lib/validate.js";
import { emailSchema, nameSchema, phoneSchema } from "../lib/user-fields.js";
import * as authService from "../services/auth.service.js";

/**
 * The HTTP edge of authentication. Reads the request, calls the service, picks
 * a status code. Nothing here talks to the database.
 *
 * Schemas live in this file because the shape of a request body is an HTTP
 * concern. The service takes an already-validated object and does not care
 * whether it came from a form, a CLI script or a test.
 */

/**
 * Eight, not six.
 *
 * Six characters is about 2 billion combinations for a lowercase password,
 * which a GPU clears in under a second against a leaked hash. scrypt makes that
 * far slower, but the floor should not depend entirely on the hash being slow.
 * No composition rules: forcing a symbol reliably produces "Password1!" and
 * nothing more.
 */
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // bcrypt's 72-byte truncation is not our problem, scrypt has no such limit,
  // but an unbounded password is an unbounded amount of hashing per request.
  .max(200, "Password must be 200 characters or fewer");

const RegisterSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  avatarUrl: mediaUrlSchema.optional(),
  // No `role`. Leaving it out of the schema is what makes "role": "super_admin"
  // in a signup body do nothing at all rather than something that depends on
  // the service remembering to ignore it.
});

const LoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

const RefreshSchema = z.object({
  refreshToken: z.string().min(1, "A refresh token is required"),
});

const LogoutSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

/** Who and where from, recorded on the session so it can be recognised later. */
function sessionContext(req: Request): authService.SessionContext {
  return {
    userAgent: req.headers["user-agent"]?.slice(0, 512),
    ipAddress: req.ip,
  };
}

export async function register(req: Request, res: Response): Promise<void> {
  const input = parseBody(RegisterSchema, req.body);
  const result = await authService.register(input, sessionContext(req));

  res.status(201).json(result);
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = parseBody(LoginSchema, req.body);
  const result = await authService.login(input, sessionContext(req));

  res.status(200).json(result);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { refreshToken } = parseBody(RefreshSchema, req.body);
  const result = await authService.refresh(refreshToken, sessionContext(req));

  res.status(200).json(result);
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken } = parseBody(LogoutSchema, req.body ?? {});
  await authService.logout(refreshToken);

  // 204, and the same 204 whether or not that token existed. See the note on
  // authService.logout.
  res.status(204).end();
}

export async function logoutEverywhere(req: Request, res: Response): Promise<void> {
  // requireAuth guarantees this, but the non-null assertion would be a lie the
  // day somebody mounts this route without it.
  if (!req.user) throw AppError.unauthorized();

  const sessions = await authService.logoutEverywhere(req.user.id);
  res.status(200).json({ sessionsEnded: sessions });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ user });
}
