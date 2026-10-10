import { randomBytes } from "node:crypto";
import { isIP } from "node:net";

import { env } from "../config/env.js";
import { prisma } from "../db/prisma.js";
import { normaliseEmail } from "../lib/email.js";
import { AppError } from "../lib/errors.js";
import { signAccessToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../lib/password.js";
import { logger } from "../lib/logger.js";
import { isUniqueViolation } from "../lib/prisma-errors.js";
import {
  PUBLIC_USER_SELECT,
  toPublicUser,
  type PublicUser,
  type UserRow,
} from "../lib/public-user.js";
import { createRefreshToken, hashRefreshToken } from "../lib/refresh-token.js";

export interface SessionContext {
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
}

export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  
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

const INVALID_CREDENTIALS = "Invalid email or password";

function validIpOrNull(value: string | undefined): string | null {
  if (!value) return null;
  return isIP(value) === 0 ? null : value;
}

let dummyHash: Promise<string> | null = null;

function dummyPasswordHash(): Promise<string> {
  dummyHash ??= hashPassword(randomBytes(32).toString("base64"));
  return dummyHash;
}

function refreshExpiry(): Date {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

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
      },
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw AppError.conflict("An account with that email address already exists");
    }
    throw error;
  }

  return issueSession(user, context);
}

export async function login(input: LoginInput, context: SessionContext): Promise<AuthResult> {
  const email = normaliseEmail(input.email);

  const row = await prisma.user.findFirst({
    where: { email },
    select: { ...PUBLIC_USER_SELECT, passwordHash: true },
  });

  const storedHash = row?.passwordHash ?? (await dummyPasswordHash());
  const correct = await verifyPassword(input.password, storedHash);

  if (!row || !correct) {
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  const { passwordHash, ...user } = row;

  return issueSession(user, context);
}

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

  const access = signAccessToken(stored.user.id, stored.user.role);

  return {
    user: toPublicUser(stored.user),
    accessToken: access.token,
    accessTokenExpiresAt: access.expiresAt.toISOString(),
    refreshToken: refreshToken.token,
    refreshTokenExpiresAt: expiresAt.toISOString(),
  };
}

export async function logout(rawToken: string | undefined): Promise<void> {
  if (!rawToken) return;

  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(rawToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function logoutEverywhere(userId: bigint): Promise<number> {
  const { count } = await prisma.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  return count;
}

export async function getCurrentUser(userId: bigint): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: PUBLIC_USER_SELECT,
  });

  if (!user) throw AppError.unauthorized("Account no longer exists");

  return toPublicUser(user);
}