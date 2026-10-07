/**
 * Emails are compared and stored lowercase, and the unique index is on
 * lower(email), so anything that reads or writes the column has to agree on
 * what "the same address" means.
 *
 * Shared rather than kept next to the one caller, because registration and a
 * profile email change both need it and the two disagreeing is how
 * "Bob@example.com" ends up as a second account alongside "bob@example.com".
 */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}
