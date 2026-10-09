import { prisma } from "../db/prisma.js";
import type { UserRole } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { PUBLIC_USER_SELECT, toPublicUser, type PublicUser } from "../lib/public-user.js";

export interface ListUsersOptions {
  page: number;
  limit: number;
  search?: string | undefined;
  role?: UserRole | undefined;
}

export interface ListUsersResult {
  users: PublicUser[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export async function listUsers(options: ListUsersOptions): Promise<ListUsersResult> {
  const { page, limit, search, role } = options;

  const where = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: PUBLIC_USER_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users: rows.map(toPublicUser),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getUser(id: bigint): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
  if (!user) throw AppError.notFound("No user with that id");

  return toPublicUser(user);
}

export async function updateUserRole(
  actorId: bigint,
  targetId: bigint,
  role: UserRole,
): Promise<PublicUser> {
  if (actorId === targetId) {
    throw AppError.badRequest(
      "You cannot change your own role. Ask another super admin, or use the admin:create script.",
    );
  }

  const target = await prisma.user.findUnique({
    where: { id: targetId },
    select: { id: true, role: true },
  });
  if (!target) throw AppError.notFound("No user with that id");

  if (target.role === role) {
    return getUser(targetId);
  }

  if (target.role === "super_admin") {
    const remaining = await prisma.user.count({
      where: { role: "super_admin", id: { not: targetId } },
    });
    if (remaining === 0) {
      throw AppError.badRequest(
        "This is the only super admin. Promote somebody else before demoting this account.",
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { role },
    select: PUBLIC_USER_SELECT,
  });

  const { count } = await prisma.refreshToken.updateMany({
    where: { userId: targetId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  logger.info(
    {
      actorId: actorId.toString(),
      targetId: targetId.toString(),
      from: target.role,
      to: role,
      sessionsEnded: count,
    },
    "user role changed",
  );

  return toPublicUser(updated);
}