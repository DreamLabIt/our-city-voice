/**
 * Recognising the errors Prisma raises for constraint violations.
 *
 * Checked structurally rather than with `instanceof`. The generated client
 * exports its error classes, but a thrown value that crossed a module boundary
 * is not worth trusting to be the same class instance, and the code is the part
 * of the contract Prisma documents.
 */

/**
 * P2002: unique constraint failed.
 *
 * Every "is this email taken" check loses a race with a concurrent request. The
 * index is what actually prevents the duplicate row, so the insert still has to
 * turn its failure into the same 409 the pre-check would have given.
 */
export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === "P2002"
  );
}
