import { prisma } from "../db/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { PostPriority, PostStatus } from "../generated/prisma/enums.js";
import {
  PUBLIC_POST_SELECT,
  toPublicPost,
  type PublicPost,
} from "../lib/public-post.js";

/**
 * Reading reports.
 *
 * One list function serves the public reports page and both dashboards, because
 * they are the same query with different filters. Splitting them would mean two
 * places to fix the next time the shape of a card changes, and the only thing
 * that actually differs is which rows a caller is allowed to ask for — which is
 * the route layer's business, not this file's.
 */

export type PostSort =
  | "newest"
  | "oldest"
  | "most_liked"
  | "most_commented"
  | "most_viewed"
  | "recently_updated";

export interface ListPostsOptions {
  page: number;
  limit: number;
  sort: PostSort;
  search?: string | undefined;
  /** Category slugs. Several, so one request can ask for roads and water. */
  category?: string[] | undefined;
  /** Ward codes. */
  ward?: string[] | undefined;
  status?: PostStatus[] | undefined;
  priority?: PostPriority[] | undefined;
  /** Restricts to one author. The route decides who may set it. */
  authorId?: bigint | undefined;
  /** Soft-deleted posts. Super admin only, enforced by the route. */
  includeDeleted?: boolean | undefined;
}

export interface ListPostsResult {
  posts: PublicPost[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

/**
 * Every sort ends with id desc.
 *
 * Not decoration. `ORDER BY like_count DESC` alone leaves rows with equal counts
 * in whatever order the planner picked, and that order is free to differ between
 * the query for page 1 and the query for page 2 — so a row appears twice, or
 * never. A unique tiebreak is what makes an OFFSET page boundary stable.
 */
const ORDER_BY: Record<PostSort, Prisma.PostOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "desc" }],
  oldest: [{ createdAt: "asc" }, { id: "asc" }],
  most_liked: [{ likeCount: "desc" }, { id: "desc" }],
  most_commented: [{ commentCount: "desc" }, { id: "desc" }],
  most_viewed: [{ viewCount: "desc" }, { id: "desc" }],
  recently_updated: [{ updatedAt: "desc" }, { id: "desc" }],
};

function buildWhere(options: ListPostsOptions): Prisma.PostWhereInput {
  const { search, category, ward, status, priority, authorId, includeDeleted } = options;

  return {
    // Soft deletes are invisible by default. A moderated report should not come
    // back on the public feed because a filter was left off.
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(status?.length ? { status: { in: status } } : {}),
    ...(priority?.length ? { priority: { in: priority } } : {}),
    ...(category?.length ? { category: { slug: { in: category } } } : {}),
    ...(ward?.length ? { ward: { code: { in: ward } } } : {}),
    ...(authorId !== undefined ? { userId: authorId } : {}),
    ...(search
      ? {
          // The same five fields the reports page searches today: its title,
          // description, tracking code and location text.
          //
          // `contains` with insensitive mode is a sequential scan. Fine at this
          // size and a problem at a million rows, where this wants a trigram
          // index (pg_trgm) or a tsvector column. Saying so here because the
          // query that quietly stops scaling is the one nobody wrote a note on.
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { trackingCode: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } },
            { city: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

/**
 * Which of these posts the viewer has liked, as one query rather than one per
 * row. Empty for a signed-out reader, who has not liked anything.
 */
async function likedPostIds(viewerId: bigint | undefined, postIds: bigint[]): Promise<Set<string>> {
  if (viewerId === undefined || postIds.length === 0) return new Set();

  const rows = await prisma.postLike.findMany({
    where: { userId: viewerId, postId: { in: postIds } },
    select: { postId: true },
  });

  return new Set(rows.map((row) => row.postId.toString()));
}

export async function listPosts(
  options: ListPostsOptions,
  viewerId?: bigint | undefined,
): Promise<ListPostsResult> {
  const { page, limit, sort } = options;
  const where = buildWhere(options);

  // One round trip for both, so the total cannot disagree with the page under
  // it when a report is filed between the two queries.
  const [rows, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      select: PUBLIC_POST_SELECT,
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.post.count({ where }),
  ]);

  const liked = await likedPostIds(
    viewerId,
    rows.map((row) => row.id),
  );

  return {
    posts: rows.map((row) => toPublicPost(row, liked.has(row.id.toString()))),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}

// ── filter options ──────────────────────────────────────────────────

export interface FilterOption {
  id: string;
  name: string;
  /** The value to send back as a filter: a category slug or a ward code. */
  value: string;
  postCount: number;
}

export interface EnumFilterOption {
  value: string;
  postCount: number;
}

export interface FilterOptions {
  categories: (FilterOption & { icon: string })[];
  wards: FilterOption[];
  statuses: EnumFilterOption[];
  priorities: EnumFilterOption[];
}

/**
 * Everything the filter dropdowns need, in one request.
 *
 * It has to be its own call rather than a block on the list response. The
 * options are a property of the whole table, and a paginated list only knows
 * about the twenty rows it returned: build the dropdown from those and "Roads"
 * disappears from the menu the moment you are on a page with no road reports.
 *
 * Counts are of every visible post, not of the current filter selection. True
 * faceted counts would mean re-running the filtered query once per option, and
 * a count that changes as you narrow is a different, more expensive feature.
 */
export async function listFilterOptions(): Promise<FilterOptions> {
  const where: Prisma.PostWhereInput = { deletedAt: null };

  // Promise.all rather than $transaction. These six feed four dropdowns, and a
  // count being one report stale next to its neighbour is not a thing anybody
  // can see; the list query is where a consistent total actually matters.
  const [categories, wards, byCategory, byWard, byStatus, byPriority] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.ward.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
    // orderBy is not optional on groupBy, so these are ordered by the count
    // they produce, biggest first. Harmless for the two that get reshaped into
    // a lookup, and the right order for the two that do not.
    prisma.post.groupBy({
      by: ["categoryId"],
      where,
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
    }),
    prisma.post.groupBy({
      by: ["wardId"],
      where,
      _count: { _all: true },
      orderBy: { _count: { wardId: "desc" } },
    }),
    prisma.post.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
      orderBy: { _count: { status: "desc" } },
    }),
    prisma.post.groupBy({
      by: ["priority"],
      where,
      _count: { _all: true },
      orderBy: { _count: { priority: "desc" } },
    }),
  ]);

  const perCategory = new Map(
    byCategory.map((group) => [group.categoryId.toString(), group._count._all]),
  );
  const perWard = new Map(byWard.map((group) => [group.wardId.toString(), group._count._all]));

  return {
    // Every category and ward is listed, including ones with no reports yet, and
    // the count says which. A dropdown that hides empty options cannot be used
    // to find out that a ward has filed nothing.
    categories: categories.map((category) => ({
      id: category.id.toString(),
      name: category.name,
      value: category.slug,
      icon: category.icon,
      postCount: perCategory.get(category.id.toString()) ?? 0,
    })),
    wards: wards.map((ward) => ({
      id: ward.id.toString(),
      name: ward.name,
      value: ward.code,
      postCount: perWard.get(ward.id.toString()) ?? 0,
    })),
    statuses: byStatus.map((group) => ({
      value: group.status,
      postCount: group._count._all,
    })),
    priorities: byPriority.map((group) => ({
      value: group.priority,
      postCount: group._count._all,
    })),
  };
}
