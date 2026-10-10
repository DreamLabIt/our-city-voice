import type { UserRole } from "../generated/prisma/enums.js";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  departmentId: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
}

export interface UserRow {
  id: bigint;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  departmentId: bigint | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}

export function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    departmentId: user.departmentId?.toString() ?? null,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  departmentId: true,
  emailVerifiedAt: true,
  createdAt: true,
} as const;