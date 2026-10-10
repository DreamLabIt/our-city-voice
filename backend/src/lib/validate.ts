import type { ZodType } from "zod";

import { AppError } from "./errors.js";

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }

    throw AppError.badRequest("Some fields need attention", fields);
  }

  return result.data;
}