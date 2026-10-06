import type { UserRole } from "../generated/prisma/enums.js";

/**
 * The only user shape that leaves the API.
 *
 * It exists so that `passwordHash` cannot reach a response by accident. Going
 * through this function is a habit; the alternative is remembering a `select`
 * at every call site, and the one time somebody forgets, the hash ships.
 *
 * Ids are strings because every id in this schema is a BigInt and a JSON number
 * above 2^53 loses precision silently. src/lib/serialize.ts would convert them
 * anyway; doing it here means the TypeScript type matches the wire format.
 */
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

/** Whatever Prisma returned, narrowed to the fields that are safe to publish. */
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

/**
 * Passed to every Prisma query that returns a user, so the hash is never even
 * fetched. Defence in depth behind toPublicUser: a row that does not contain
 * the password hash cannot leak it however badly the caller behaves.
 */
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
