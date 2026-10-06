import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { UserRole } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
import { InvalidTokenError, verifyAccessToken } from "../lib/jwt.js";

/**
 * Who is making this request, as far as the access token claims.
 *
 * Claims only. Nothing here was read from the database on this request, which
 * is the trade an access token makes. Anything that must be current (a role
 * change taking effect, an account deletion) reads the row.
 */
export interface AuthenticatedUser {
  id: bigint;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Pulls the token out of `Authorization: Bearer <token>`.
 *
 * Header only, no cookie fallback and no `?token=` query parameter. A token in
 * a query string ends up in access logs, browser history and Referer headers.
 */
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

/**
 * Rejects anything without a valid access token.
 *
 * The 401 body never explains which check failed. "Signature mismatch" and
 * "expired" are useful in the log and are an oracle in the response.
 */
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

/**
 * Attaches the user when a usable token is present and carries on when it is
 * not. For endpoints that are public but answer differently to a signed-in
 * reader, such as marking which reports the caller has already liked.
 */
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
    // A bad token on an optional route is treated as no token. Failing here
    // would make an expired session break pages that do not need one.
    req.log?.debug({ reason: error.message }, "ignoring unusable access token");
  }

  next();
};

/**
 * Role gate. Must come after requireAuth, which is what guarantees req.user.
 *
 * 403, not 404: the caller is authenticated and this says the account is not
 * allowed, which is the honest answer and the one a client can act on.
 */
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

/** The one gate that matters today: user management is super admin only. */
export const requireSuperAdmin: RequestHandler = requireRole("super_admin");
