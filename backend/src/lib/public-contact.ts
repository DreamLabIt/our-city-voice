export interface PublicContactCategory {
  id: string;
  name: string;
}

export interface PublicContactMessage {
  id: string;
  category: PublicContactCategory;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessageRow {
  id: bigint;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  handledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  category: { id: bigint; name: string };
}

export function toPublicContactMessage(row: ContactMessageRow): PublicContactMessage {
  return {
    id: row.id.toString(),
    category: { id: row.category.id.toString(), name: row.category.name },
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    handledAt: row.handledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const CONTACT_MESSAGE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  subject: true,
  message: true,
  handledAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
} as const;
