import type { ZodType } from "zod";

import { AppError } from "./errors.js";

/**
 * Parses a request body against a zod schema, or throws a 400 that names the
 * fields that failed.
 *
 * A plain function rather than middleware, deliberately. Middleware would have
 * to assign the parsed value back onto `req.body`, whose type is `any`, so the
 * controller would receive no type information from the schema it just
 * validated against. Calling this in the controller keeps the inference:
 *
 *   const input = parseBody(LoginSchema, req.body);
 *   //    ^? { email: string; password: string }
 */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);

  if (!result.success) {
    // Flattened to field -> messages, which is the shape a form needs to put
    // each message next to its own input.
    const fields: Record<string, string[]> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      (fields[key] ??= []).push(issue.message);
    }

    throw AppError.badRequest("Some fields need attention", fields);
  }

  return result.data;
}
