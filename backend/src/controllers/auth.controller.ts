import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { mediaUrlSchema } from "../lib/media-url.js";
import { parseBody } from "../lib/validate.js";
import { emailSchema, nameSchema, phoneSchema } from "../lib/user-fields.js";
import * as authService from "../services/auth.service.js";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(200, "Password must be 200 characters or fewer");

const RegisterSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema.optional(),
  avatarUrl: mediaUrlSchema.optional(),
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

  res.status(204).end();
}

export async function logoutEverywhere(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const sessions = await authService.logoutEverywhere(req.user.id);
  res.status(200).json({ sessionsEnded: sessions });
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) throw AppError.unauthorized();

  const user = await authService.getCurrentUser(req.user.id);
  res.status(200).json({ user });
}