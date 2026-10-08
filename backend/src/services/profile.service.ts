import { prisma } from "../db/prisma.js";
import { normaliseEmail } from "../lib/email.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { verifyPassword } from "../lib/password.js";
import { isUniqueViolation } from "../lib/prisma-errors.js";
import { PUBLIC_USER_SELECT, toPublicUser, type PublicUser } from "../lib/public-user.js";

/**
 * Your own account: reading it and changing it.
 *
 * Distinct from user.service.ts, which is the super admin's view of everybody
 * else. The separation is not cosmetic. The admin service may change a role and
 * end somebody's sessions; this one must never be able to, because every caller
 * here is acting on themselves and a request body is not allowed to grant
 * privileges. Keeping them in different files means the fields each is allowed
 * to touch are visible at a glance instead of buried in a branch.
 */

/**
 * Reading your own account is the same operation GET /auth/me performs, so this
 * is that function under a second name rather than a second copy of it. One
 * place decides what happens when the token verifies but the row has since been
 * deleted.
 */
export { getCurrentUser as getProfile } from "./auth.service.js";

/**
 * Only these four fields, and `role` and `departmentId` are absent on purpose
 * rather than ignored later: a field this interface does not mention cannot
 * reach the update call however the body is shaped.
 *
 * `null` and absent mean different things. Absent leaves the column alone;
 * null clears it. Without that distinction a form that only edits the name
 * would wipe the phone number of anybody who had one.
 */
export interface UpdateProfileInput {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | null | undefined;
  avatarUrl?: string | null | undefined;
  /** Required only to change the email address. See below. */
  currentPassword?: string | undefined;
}

/** Exactly the columns this service is allowed to write. */
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

  // The token verified, so the account existed when it was minted. Reaching
  // here means it has since been deleted.
  if (!current) throw AppError.unauthorized("Account no longer exists");

  const data: ProfileUpdateData = {};

  if (input.name !== undefined) data.name = input.name;

  // An empty string is how a cleared text input arrives, and storing "" in a
  // nullable column gives two representations of "no phone number" that every
  // reader then has to handle. One of them is enough.
  if (input.phone !== undefined) data.phone = input.phone?.trim() || null;

  if (input.avatarUrl !== undefined) data.avatarUrl = input.avatarUrl;

  if (input.email !== undefined) {
    const email = normaliseEmail(input.email);

    /**
     * Compared against the stored address first, and the password is only
     * demanded when it actually differs.
     *
     * A settings form submits every field it renders, including the email it
     * loaded, so requiring a password whenever `email` is present in the body
     * would mean asking for one on every name change. The server is the only
     * side that can tell a resubmitted address from a new one.
     */
    if (email !== current.email) {
      if (!input.currentPassword) {
        throw AppError.badRequest("Confirm your password to change your email address", {
          currentPassword: ["Enter your current password to change your email address"],
        });
      }

      const correct = await verifyPassword(input.currentPassword, current.passwordHash);
      if (!correct) {
        // 400 with a field, not 401. The caller's session is perfectly valid and
        // a 401 here would be indistinguishable from an expired one, which sends
        // a client off refreshing or signing the person out over a typo.
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
      // The new address is unverified by definition. Nothing reads this column
      // yet, so this is only correct rather than load-bearing; it stops being a
      // no-op the day email verification lands.
      data.emailVerifiedAt = null;
    }
  }

  // Everything sent matched what is already stored. Returning the row beats a
  // 400: nothing is wrong, and a form that resubmits unchanged values should
  // not have to special-case a failure.
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
    // The findFirst above loses a race with a concurrent signup on the same
    // address. The unique index is what prevents the duplicate; this turns its
    // error into the 409 the pre-check would have given.
    if (isUniqueViolation(error)) {
      throw AppError.conflict("An account with that email address already exists");
    }
    throw error;
  }

  logger.info(
    {
      userId: userId.toString(),
      // Field names, not values. Which columns somebody touched is useful in a
      // log; their phone number is not something to write to disk twice.
      fields: Object.keys(data),
    },
    "profile updated",
  );

  return toPublicUser(updated);
}
