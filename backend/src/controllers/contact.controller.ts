import type { Request, Response } from "express";
import { z } from "zod";

import { emailSchema, nameSchema, phoneSchema } from "../lib/user-fields.js";
import { parseBody } from "../lib/validate.js";
import * as contactService from "../services/contact.service.js";

// A query parameter that is present but blank means "no opinion", matching the
// report list. A genuinely wrong value still fails.
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (raw) => (typeof raw === "string" && raw.trim() === "" ? undefined : raw),
    schema,
  );
}

// The category comes back from GET /contact/categories as a string id, per the
// id convention, so that is what this expects.
const categoryIdSchema = z
  .string()
  .trim()
  .regex(/^\d{1,19}$/, "Choose a category from the list");

const CreateContactMessageSchema = z.strictObject({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.nullish(),
  categoryId: categoryIdSchema,
  subject: z.string().trim().min(1, "Add a subject").max(160, "Subject is too long"),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message is too long"),
});

const ListQuerySchema = z.object({
  page: optional(z.coerce.number().int().positive().default(1)),
  limit: optional(z.coerce.number().int().positive().max(100).default(20)),
});

export async function categories(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ categories: await contactService.listContactCategories() });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = parseBody(CreateContactMessageSchema, req.body ?? {});
  const message = await contactService.createContactMessage({
    ...input,
    categoryId: BigInt(input.categoryId),
  });

  res.status(201).json({ message });
}

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseBody(ListQuerySchema, req.query);

  res.status(200).json(await contactService.listContactMessages(query));
}
