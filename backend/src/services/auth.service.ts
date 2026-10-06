import { randomBytes } from "node:crypto";
import { isIP } from "node:net";

import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { AppError } from "../lib/errors.js";
import { signAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { logger } from "../lib/logger.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from "../lib/public-user.js";
import { createRefreshToken, hashRefreshToken } from "../lib/refresh-token.js";

/**
 * Sessions: a short-lived signed access token plus a long-lived opaque refresh
 * token, rotated on every use.
 *
 * Why two tokens. The access token is not checked against the database, which
 * is what makes it cheap, and also what makes it impossible to revoke before
 * it expires. Keeping it to minutes bounds that. The refresh token is the part
 * that is checked, stored hashed, and can be killed.
 *
 * Neither token is set as a cookie here. This API answers JSON and nothing
 * else; the Next.js server is the only client that sees these values and it
 * puts them in its own httpOnly cookies. That avoids cross-site cookie rules
 * entirely, and the browser never holds a token in reachable JavaScript.
 */

export interface SessionContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  /** ISO. The caller sets a cookie max-age from this rather than guessing. */
  accessTokenExpiresAt: string;
  refreshToken: string;
  refreshTokenExpiresAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string | undefined;
  avatarUrl?: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * One message for "no such account" and for "wrong password".
 *
 * Distinguishing them turns the login form into an account-existence oracle,
 * which is how a leaked password list gets matched against your user base.
 */
const INVALID_CREDENTIALS = "Invalid email or password";

/** Emails are compared and stored lowercase; the database enforces it too. */
function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * `ip_address` is a Postgres inet column, so a value that is not an IP makes
 * the insert fail. req.ip is usually one, but behind a misconfigured proxy it
 * can be anything in X-Forwarded-For. Recording nothing beats 500ing a login.
 */
function validIpOrNull(value: string | undefined): string | null {
  if (!value) return null;
  return isIP(value) === 0 ? null : value;
}

let dummyHash: Promise<string> | null = null;

/**
 * A real hash of a random string, used to make the "no such user" path cost
 * the same scrypt work as the "wrong password" path.
 *
 * Without it, a missing account answers in a millisecond and an existing one
 * takes ~100ms, so an attacker can enumerate accounts with a stopwatch even
 * though both responses say the same thing.
 */
function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString("base64"));
  return dummyHash;
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

/** Mints both tokens and records the refresh half. */
async function issueSession(user: UserRow, context: SessionContext): Promise<AuthResult> {
  const access = signAccessToken(user.id, user.role);
  const refresh = createRefreshToken();
  const expiresAt = refreshExpiry();

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: refresh.tokenHash,
      expiresAt,
      userAgent: context.userAgent ?? null,
      ipAddress: validIpOrNull(context.ipAddress),
    },
  });

  return {
    user: toPublicUser(user),
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt.toISOString(),
    refreshToken: refresh.token,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

export async function register(
  input: RegisterInput,
  context: SessionContext,
): Promise<AuthResult> {
  const email = normaliseEmail(input.email);

  const existing = await prisma.user.findFirst({ where: { email }, select: { id: true } });
  if (existing) {
    throw AppError.conflict("An account with that email address already exists");
  }

  const passwordHash = await hashPassword(input.password);

  let user: UserRow;
  try {
    user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
        phone: input.phone?.trim() || null,
        avatarUrl: input.avatarUrl ?? null,
        // Never from input. `role` is absent on purpose rather than set to
        // "user": the column default is the single source of that decision, and
        // spreading an untrusted object into this call cannot reach it.
      },
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    // The findFirst above loses a race with a second concurrent signup. The
    // unique index on lower(email) is what actually prevents the duplicate;
    // this turns its error into the same 409 the happy path would have given.
    if (isUniqueViolation(error)) {
      throw AppError.conflict("An account with that email address already exists");
    }
    throw error;
  }

  return issueSession(user, context);
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}

export async function login(input: LoginInput, context: SessionContext): Promise<AuthResult> {
  const email = normaliseEmail(input.email);

  const row = await prisma.user.findFirst({
    where: { email },
    select: { ...PUBLIC_USER_SELECT, passwordHash: true },
  });

  // Hash against a throwaway when there is no such account, so both failure
  // paths cost the same scrypt work. See dummyPasswordHash.
  const storedHash = row?.passwordHash ?? (await dummyPasswordHash());
  const correct = await verifyPassword(input.password, storedHash);

  if (!row || !correct) {
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  const { passwordHash, ...user } = row;

  return issueSession(user, context);
}

/**
 * Exchanges a refresh token for a fresh pair, and invalidates the one used.
 *
 * Rotation plus reuse detection: each token works exactly once. If a revoked
 * token comes back, either it was stolen and replayed or the real client lost
 * our response and retried. Both cases end the same way, with every session for
 * that account killed, because there is no way to tell from here which of the
 * two holders is the attacker.
 */
export async function refresh(
  rawToken: string,
  context: SessionContext,
): Promise<AuthResult> {
  const tokenHash = hashRefreshToken(rawToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      revokedAt: true,
      user: { select: PUBLIC_USER_SELECT },
    },
  });

  if (!stored) throw AppError.unauthorized("Session is no longer valid");

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    logger.warn(
      { userId: stored.userId.toString() },
      "revoked refresh token was replayed, all sessions for the account ended",
    );
    throw AppError.unauthorized("Session is no longer valid");
  }

  if (stored.expiresAt.getTime() <= Date.now()) {
    throw AppError.unauthorized("Session has expired");
  }

  const refreshToken = createRefreshToken();
  const expiresAt = refreshExpiry();

  // One transaction, so there is never a moment where the old token is dead and
  // the new one does not exist. A crash between the two would sign the user out.
  await prisma.$transaction([
    prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    }),
    prisma.refreshToken.create({
      data: {
        userId: stored.userId,
        tokenHash: refreshToken.tokenHash,
        expiresAt,
        userAgent: context.userAgent ?? null,
        ipAddress: validIpOrNull(context.ipAddress),
      },
    }),
  ]);

  // Role is read fresh here rather than copied from the old token, which is
  // what makes a role change take effect within one access-token lifetime.
  const access = signAccessToken(stored.user.id, stored.user.role);

  return {
    user: toPublicUser(stored.user),
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt.toISOString(),
    refreshToken: refreshToken.token,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

/**
 * Idempotent, and silent about whether the token existed. Signing out is not a
 * place to report errors: the client is discarding its cookies either way, and
 * saying "that token was already revoked" only tells an attacker something.
 */
export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Signs out every device. Used after a password change, and on token reuse. */
export async function logoutEverywhere(userId: bigint): Promise<number> {
  const { count } = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}

/** The authenticated user, read fresh rather than taken from token claims. */
export async function getCurrentUser(userId: bigint): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });

  // The token verified, so the account existed when it was minted. Reaching
  // here means it has since been deleted.
  if (!user) throw AppError.unauthorized("Account no longer exists");

  return toPublicUser(user);
}
