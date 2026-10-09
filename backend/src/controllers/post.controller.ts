import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { parseBody } from "../lib/validate.js";
import * as postService from "../services/post.service.js";

function listOf<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (raw) => {
      if (raw === undefined) return undefined;
      const values = (Array.isArray(raw) ? raw : [raw]).flatMap((value) =>
        typeof value === "string" ? value.split(",") : [value],
      );
      const cleaned = values
        .map((value) => (typeof value === "string" ? value.trim() : value))
        .filter((value) => value !== "");

      return cleaned.length === 0 ? undefined : cleaned;
    },
    z.array(schema).optional(),
  );
}

function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (raw) => (typeof raw === "string" && raw.trim() === "" ? undefined : raw),
    schema,
  );
}

const statusSchema = z.enum(["pending", "in_progress", "resolved", "rejected"]);
const prioritySchema = z.enum(["low", "medium", "high", "critical"]);

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Must be a lowercase slug, such as 'roads' or 'ward-22'");

const ListQuerySchema = z.object({
  page: optional(z.coerce.number().int().positive().default(1)),
  limit: optional(z.coerce.number().int().positive().max(100).default(12)),
  sort: optional(
    z
      .enum(["newest", "oldest", "most_liked", "most_commented", "most_viewed", "recently_updated"])
      .default("newest"),
  ),
  search: optional(z.string().trim().min(1).max(120).optional()),
  category: listOf(slugSchema),
  ward: listOf(slugSchema),
  status: listOf(statusSchema),
  priority: listOf(prioritySchema),

  
  mine: optional(z.stringbool().default(false)),
  
  authorId: optional(
    z.string().regex(/^\d+$/, "authorId must be a positive integer").optional(),
  ),
  
  includeDeleted: optional(z.stringbool().default(false)),
});

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseBody(ListQuerySchema, req.query);

  
  if (query.mine && query.authorId !== undefined) {
    throw AppError.badRequest("Send either mine or authorId, not both");
  }

  let authorId: bigint | undefined;

  if (query.mine) {
    if (!req.user) throw AppError.unauthorized("Sign in to see your own reports");
    authorId = req.user.id;
  }

  if (query.authorId !== undefined) {
    if (req.user?.role !== "super_admin") throw AppError.forbidden();
    authorId = BigInt(query.authorId);
  }

  if (query.includeDeleted && req.user?.role !== "super_admin") {
    throw AppError.forbidden();
  }

  const result = await postService.listPosts(
    {
      page: query.page,
      limit: query.limit,
      sort: query.sort,
      search: query.search,
      category: query.category,
      ward: query.ward,
      status: query.status,
      priority: query.priority,
      authorId,
      includeDeleted: query.includeDeleted,
    },
    req.user?.id,
  );

  res.status(200).json(result);
}

export async function filters(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await postService.listFilterOptions());
}

function parseIdentifier(raw: string | string[] | undefined): postService.PostIdentifier {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 64) {
    throw AppError.badRequest("Give a report's tracking code, such as OCV-2026-000123");
  }

  if (/^\d+$/.test(raw)) return { id: BigInt(raw) };

  if (!/^[A-Za-z0-9-]+$/.test(raw)) {
    throw AppError.badRequest("Give a report's tracking code, such as OCV-2026-000123");
  }

  return { trackingCode: raw.toUpperCase() };
}

const DetailQuerySchema = z.object({
  includeDeleted: optional(z.stringbool().default(false)),
});

export async function detail(req: Request, res: Response): Promise<void> {
  const query = parseBody(DetailQuerySchema, req.query);

  if (query.includeDeleted && req.user?.role !== "super_admin") {
    throw AppError.forbidden();
  }

  const result = await postService.getPost(parseIdentifier(req.params.code), req.user?.id, {
    includeDeleted: query.includeDeleted,
    countView: true,
  });

  res.status(200).json(result);
}

const CommentsQuerySchema = z.object({
  page: optional(z.coerce.number().int().positive().default(1)),
  limit: optional(z.coerce.number().int().positive().max(100).default(20)),
});

export async function comments(req: Request, res: Response): Promise<void> {
  const query = parseBody(CommentsQuerySchema, req.query);

  
  const post = await postService.findPostId(parseIdentifier(req.params.code));

  const result = await postService.listComments(
    post,
    { page: query.page, limit: query.limit },
    req.user?.id,
  );

  res.status(200).json(result);
}