import { z } from "zod";

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Please enter your full name")
  .max(120, "Name is too long");

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email address is required")
  .max(254, "Email address is too long")
  .pipe(z.email("Enter a valid email address"));

export const phoneSchema = z.string().trim().max(32, "Phone number is too long");