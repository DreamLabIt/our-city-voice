import { prisma } from "../db/prisma.js";
import { normaliseEmail } from "../lib/email.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import {
  CONTACT_MESSAGE_SELECT,
  toPublicContactMessage,
  type PublicContactCategory,
  type PublicContactMessage,
} from "../lib/public-contact.js";

export interface CreateContactMessageInput {
  categoryId: bigint;
  name: string;
  email: string;
  phone?: string | null | undefined;
  subject: string;
  message: string;
}

export interface ListContactMessagesOptions {
  page: number;
  limit: number;
}

export interface ListContactMessagesResult {
  messages: PublicContactMessage[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export async function listContactCategories(): Promise<PublicContactCategory[]> {
  const rows = await prisma.contactCategory.findMany({
    select: { id: true, name: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({ id: row.id.toString(), name: row.name }));
}

export async function createContactMessage(
  input: CreateContactMessageInput,
): Promise<PublicContactMessage> {
  const category = await prisma.contactCategory.findUnique({
    where: { id: input.categoryId },
    select: { id: true },
  });

  if (!category) {
    throw AppError.badRequest("Some fields need attention", {
      categoryId: ["Choose a category from the list"],
    });
  }

  const created = await prisma.contactMessage.create({
    data: {
      categoryId: input.categoryId,
      name: input.name,
      email: normaliseEmail(input.email),
      phone: input.phone?.trim() || null,
      subject: input.subject,
      message: input.message,
    },
    select: CONTACT_MESSAGE_SELECT,
  });

  // Only ids and the category go to the log line; the body is personal data and
  // has no place in a log sink.
  logger.info(
    {
      contactMessageId: created.id.toString(),
      categoryId: category.id.toString(),
    },
    "contact message received",
  );

  return toPublicContactMessage(created);
}

export async function listContactMessages(
  options: ListContactMessagesOptions,
): Promise<ListContactMessagesResult> {
  const { page, limit } = options;

  const [rows, total] = await prisma.$transaction([
    prisma.contactMessage.findMany({
      select: CONTACT_MESSAGE_SELECT,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.contactMessage.count(),
  ]);

  return {
    messages: rows.map(toPublicContactMessage),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}
