import { prisma } from "../db/prisma.js";
import { normaliseEmail } from "../lib/email.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { verifyPassword } from "../lib/password.js";
import { isUniqueViolation } from "../lib/prisma-errors.js";
import { PUBLIC_USER_SELECT, toPublicUser, type PublicUser } from "../lib/public-user.js";

export { getCurrentUser as getProfile } from "./auth.service.js";

export interface UpdateProfileInput {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  
  currentPassword?: string | undefined;
}

interface ProfileUpdateData {
  name?: string;
  email?: string;
  phone?: string | null;
  avatarUrl?: string | null;
  emailVerifiedAt?: Date | null;
}

export async function updateProfile(
  userId: bigint,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, passwordHash: true },
  });

  if (!current) throw AppError.unauthorized("Account no longer exists");

  const data: ProfileUpdateData = {};

  if (input.name !== undefined) data.name = input.name;

  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;

  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

  if (input.email !== undefined) {
    const email = normaliseEmail(input.email);

    
    if (email !== current.email) {
      if (!input.currentPassword) {
        throw AppError.badRequest("Confirm your password to change your email address", {
          currentPassword: ["Enter your current password to change your email address"],
        });
      }

      const correct = await verifyPassword(input.currentPassword, current.passwordHash);
      if (!correct) {
        throw AppError.badRequest("Some fields need attention", {
          currentPassword: ["That password is not correct"],
        });
      }

      const taken = await prisma.user.findFirst({
        where: { email, id: { not: userId } },
        select: { id: true },
      });
      if (taken) {
        throw AppError.conflict("An account with that email address already exists");
      }

      data.email = email;
      data.emailVerifiedAt = null;
    }
  }

  if (Object.keys(data).length === 0) {
    const unchanged = await prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
    if (!unchanged) throw AppError.unauthorized("Account no longer exists");

    return toPublicUser(unchanged);
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: PUBLIC_USER_SELECT,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw AppError.conflict("An account with that email address already exists");
    }
    throw error;
  }

  logger.info(
    {
      userId: userId.toString(),
      fields: Object.keys(data),
    },
    "profile updated",
  );

  return toPublicUser(updated);
}