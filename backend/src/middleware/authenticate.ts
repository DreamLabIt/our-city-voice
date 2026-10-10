import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { UserRole } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
import { InvalidTokenError, verifyAccessToken } from "../lib/jwt.js";

export interface AuthenticatedUser {
  id: bigint;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

function readBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;

  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;

  return token.trim() || null;
}

function toAuthenticatedUser(token: string): AuthenticatedUser {
  const claims = verifyAccessToken(token);

  let id: bigint;
  try {
    id = BigInt(claims.sub);
  } catch {
    throw new InvalidTokenError("subject is not an id");
  }

  return { id, role: claims.role };
}

export const requireAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  if (!token) {
    next(AppError.unauthorized());
    return;
  }

  try {
    req.user = toAuthenticatedUser(token);
    next();
  } catch (error) {
    if (error instanceof InvalidTokenError) {
      req.log?.debug({ reason: error.message }, "access token rejected");
      next(AppError.unauthorized());
      return;
    }
    next(error);
  }
};

export const optionalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = readBearerToken(req);
  if (!token) {
    next();
    return;
  }

  try {
    req.user = toAuthenticatedUser(token);
  } catch (error) {
    if (!(error instanceof InvalidTokenError)) {
      next(error);
      return;
    }
    req.log?.debug({ reason: error.message }, "ignoring unusable access token");
  }

  next();
};

export function requireRole(...roles: UserRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(AppError.unauthorized());
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(AppError.forbidden());
      return;
    }

    next();
  };
}

export const requireSuperAdmin: RequestHandler = requireRole("super_admin");