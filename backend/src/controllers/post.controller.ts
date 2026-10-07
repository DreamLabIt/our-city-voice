import type { Request, Response } from "express";
import { z } from "zod";

import { AppError } from "../lib/errors.js";
import { parseBody } from "../lib/validate.js";
import * as postService from "../services/post.service.js";

/**
 * The HTTP edge of reading reports.
 *
 * This is also where who-may-see-what is decided, because it is the only layer
 * that knows both the query string and the caller. post.service.ts takes the
 * filters it is given and does not ask whether the caller was entitled to them.
 */

/**
 * A query parameter that can arrive three ways and means a list in all of them:
 *
 *   ?status=pending                     one value
 *   ?status=pending,in_progress         comma separated, which is what a URL
 *                                       built by hand usually looks like
 *   ?status=pending&status=in_progress   repeated, which is what Express hands
 *                                       over as an array
 *
 * Accepting all three costs one preprocess and saves every caller from caring.
 * Blank entries are dropped so a trailing comma is not a filter for "".
 */
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

/**
 * Treats an empty value as a missing one.
 *
 * A query string built from form state is full of blanks: an untouched search
 * box submits `?search=`, a page counter that has not initialised submits
 * `?page=`. Both are the caller saying "no opinion", and answering a 400 to that
 * makes the frontend build the URL conditionally for every single parameter.
 *
 * Wrapped around the whole schema including its default, so a blank falls
 * through to the default rather than past it.
 */
function optional<T extends z.ZodType>(schema: T) {
  return z.preprocess(
    (raw) => (typeof raw === "string" && raw.trim() === "" ? undefined : raw),
    schema,
  );
}

const statusSchema = z.enum(["pending", "in_progress", "resolved", "rejected"]);
const prioritySchema = z.enum(["low", "medium", "high", "critical"]);

/**
 * A slug or ward code, not a display name.
 *
 * Capped and character-restricted because these go into an `IN` list. Length is
 * the real protection: without it, a thousand comma-separated values is a free
 * way to make Postgres build a thousand-element array per request.
 */
const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Must be a lowercase slug, such as 'roads' or 'ward-22'");

const ListQuerySchema = z.object({
  page: optional(z.coerce.number().int().positive().default(1)),
  // Capped, same reasoning as the users list: a client asking for limit=1000000
  // should not be able to pull the whole table into memory. Twelve by default
  // because the reports grid is one, two, three or four columns wide.
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

  // ── dashboard ──
  /** Only the caller's own reports. Needs a session; see below. */
  mine: optional(z.stringbool().default(false)),
  /** Somebody else's reports. Super admin only. */
  authorId: optional(
    z.string().regex(/^\d+$/, "authorId must be a positive integer").optional(),
  ),
  /** Soft-deleted reports, which are invisible by default. Super admin only. */
  includeDeleted: optional(z.stringbool().default(false)),
});

export async function list(req: Request, res: Response): Promise<void> {
  const query = parseBody(ListQuerySchema, req.query);

  /**
   * `mine` and `authorId` both narrow to one author and would silently fight
   * over which one wins. Rejecting the combination is the only answer that
   * cannot surprise somebody.
   */
  if (query.mine && query.authorId !== undefined) {
    throw AppError.badRequest("Send either mine or authorId, not both");
  }

  let authorId: bigint | undefined;

  if (query.mine) {
    // optionalAuth means an unsigned request reaches here with no user, and
    // answering it with the whole feed would be worse than refusing: "my
    // reports" returning everybody's is a privacy bug that looks like a page
    // that works.
    if (!req.user) throw AppError.unauthorized("Sign in to see your own reports");
    authorId = req.user.id;
  }

  if (query.authorId !== undefined) {
    // Reading one person's reports by id is an admin view. Without this, the
    // author filter is a way to enumerate what any given account has filed,
    // including the reports they filed anonymously.
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
