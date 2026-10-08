import { z } from "zod";

/**
 * The field rules an account's own details are held to.
 *
 * Shared because registration and a profile update both accept a name, an email
 * and a phone number, and two schemas drifting apart means an address that
 * signup accepts can be rejected on the settings page, or worse, the reverse.
 *
 * Password rules are not here. The minimum length applies to choosing a new
 * password, never to confirming an existing one: an account created before the
 * rule tightened still has to be able to prove who it is.
 */

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your full name")
  .max(120, "Name is too long");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  // Longer than any real address. Without a cap, a megabyte of @ signs becomes
  // a free way to make the server work.
  .max(254, "Email address is too long")
  .pipe(z.email("Enter a valid email address"));

export const phoneSchema = z.string().trim().max(32, "Phone number is too long");
