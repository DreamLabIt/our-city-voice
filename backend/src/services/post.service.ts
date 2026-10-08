import { prisma } from "../db/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { PostPriority, PostStatus } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
import {
  PUBLIC_COMMENT_SELECT,
  toPublicComment,
  type PublicComment,
  type PublicCommentThread,
} from "../lib/public-comment.js";
import {
  PUBLIC_POST_DETAIL_SELECT,
  PUBLIC_POST_SELECT,
  toPublicPost,
  toPublicPostDetail,
  type PublicPost,
  type PublicPostDetail,
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


// ── one report ──────────────────────────────────────────────────────

/**
 * How a report was asked for.
 *
 * A tracking code is the identifier meant for public URLs: the primary key is
 * sequential, so a URL built from it tells anybody who looks how many reports
 * the platform has ever received. Ids are accepted as well because they are
 * already in every list response and refusing them would be theatre.
 */
export type PostIdentifier = { trackingCode: string } | { id: bigint };

export interface GetPostOptions {
  /** Soft-deleted reports. Super admin only, enforced by the controller. */
  includeDeleted?: boolean | undefined;
  /**
   * Whether to count this read as a view.
   *
   * Off by default so that nothing increments the counter by accident. The
   * controller turns it on for the one route a person actually lands on.
   */
  countView?: boolean | undefined;
}

export interface GetPostResult {
  post: PublicPostDetail;
  /** A few other reports to offer at the bottom of the page. */
  related: PublicPost[];
}

const RELATED_LIMIT = 4;

/**
 * Other reports worth showing beneath this one.
 *
 * Same category first, then the newest of anything else to fill the row. The
 * padding matters: a category with one report would otherwise leave the section
 * empty, which looks like a bug rather than like a quiet category.
 *
 * Deliberately not a parameter on the list endpoint. "Four posts, this category
 * first, excluding this one, padded with others" is not a filter, and bending
 * listPosts into expressing it would make that function worse.
 */
async function listRelated(
  postId: bigint,
  categoryId: bigint,
  viewerId: bigint | undefined,
): Promise<PublicPost[]> {
  const base: Prisma.PostWhereInput = { deletedAt: null, id: { not: postId } };

  const sameCategory = await prisma.post.findMany({
    where: { ...base, categoryId },
    select: PUBLIC_POST_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: RELATED_LIMIT,
  });

  const shortfall = RELATED_LIMIT - sameCategory.length;
  const others =
    shortfall > 0
      ? await prisma.post.findMany({
          where: { ...base, categoryId: { not: categoryId } },
          select: PUBLIC_POST_SELECT,
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: shortfall,
        })
      : [];

  const rows = [...sameCategory, ...others];
  const liked = await likedPostIds(
    viewerId,
    rows.map((row) => row.id),
  );

  return rows.map((row) => toPublicPost(row, liked.has(row.id.toString())));
}

/**
 * Resolves an identifier to a primary key, for routes that hang off a report
 * without needing the report itself.
 *
 * Soft-deleted reports resolve too. The alternative is a comments endpoint that
 * 404s for a super admin looking at why something was moderated.
 */
export async function findPostId(identifier: PostIdentifier): Promise<bigint> {
  const post = await prisma.post.findFirst({ where: identifier, select: { id: true } });
  if (!post) throw AppError.notFound("No report with that tracking code");

  return post.id;
}

export async function getPost(
  identifier: PostIdentifier,
  viewerId?: bigint | undefined,
  options: GetPostOptions = {},
): Promise<GetPostResult> {
  const where: Prisma.PostWhereInput = {
    ...identifier,
    ...(options.includeDeleted ? {} : { deletedAt: null }),
  };

  // findFirst, not findUnique: both identifiers are unique on their own, but the
  // deletedAt condition makes this a filtered lookup rather than a key lookup.
  const post = await prisma.post.findFirst({ where, select: PUBLIC_POST_DETAIL_SELECT });

  // The same 404 whether the report never existed or was moderated away. A
  // distinct "this was removed" tells somebody their report was deleted and tells
  // everybody else that a given tracking code was real, which is worse.
  if (!post) throw AppError.notFound("No report with that tracking code");

  /**
   * Counted before the response is built, so the number a reader sees includes
   * their own visit rather than lagging it by one.
   *
   * No deduplication. Every successful read of this route counts, so a refresh
   * counts twice and a crawler counts once per crawl. Doing better needs a record
   * of who has already viewed what inside some window, which is a table and a
   * decision about how long the window is; the column is a cache of engagement,
   * not an audited figure, and inflating it is a smaller problem than leaving the
   * feature out.
   */
  let viewCount = post.viewCount;
  if (options.countView) {
    const updated = await prisma.post.update({
      where: { id: post.id },
      data: { viewCount: { increment: 1 } },
      select: { viewCount: true },
    });
    viewCount = updated.viewCount;
  }

  const liked = await likedPostIds(viewerId, [post.id]);

  return {
    post: toPublicPostDetail(
      { ...post, viewCount },
      liked.has(post.id.toString()),
    ),
    related: await listRelated(post.id, post.category.id, viewerId),
  };
}

// ── comments ────────────────────────────────────────────────────────

export interface ListCommentsOptions {
  page: number;
  limit: number;
}

export interface ListCommentsResult {
  comments: PublicCommentThread[];
  /** Top-level comments only, which is what the pages are over. */
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

/**
 * Which of these comments the viewer has liked, batched the same way posts are.
 * Covers top-level comments and their replies in one query.
 */
async function likedCommentIds(
  viewerId: bigint | undefined,
  commentIds: bigint[],
): Promise<Set<string>> {
  if (viewerId === undefined || commentIds.length === 0) return new Set();

  const rows = await prisma.commentLike.findMany({
    where: { userId: viewerId, commentId: { in: commentIds } },
    select: { commentId: true },
  });

  return new Set(rows.map((row) => row.commentId.toString()));
}

/**
 * A page of comment threads on one report.
 *
 * Paginated over top-level comments, with every reply to the ones on this page
 * attached in full. Paginating replies as well would mean a "show more" control
 * inside each thread for a schema that caps nesting at one level and threads that
 * are a handful of messages long.
 *
 * Two queries for the replies rather than a nested include, because an include
 * would have Prisma issue one reply query per parent.
 */
export async function listComments(
  postId: bigint,
  options: ListCommentsOptions,
  viewerId?: bigint | undefined,
): Promise<ListCommentsResult> {
  const { page, limit } = options;
  const where: Prisma.CommentWhereInput = { postId, parentId: null, deletedAt: null };

  const [parents, total] = await prisma.$transaction([
    prisma.comment.findMany({
      where,
      select: PUBLIC_COMMENT_SELECT,
      // Oldest first, and the id tiebreak for the same reason every post sort
      // has one: equal timestamps must not reorder between pages.
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  const parentIds = parents.map((parent) => parent.id);

  const replies =
    parentIds.length === 0
      ? []
      : await prisma.comment.findMany({
          where: { parentId: { in: parentIds }, deletedAt: null },
          select: { ...PUBLIC_COMMENT_SELECT, parentId: true },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        });

  const liked = await likedCommentIds(viewerId, [
    ...parentIds,
    ...replies.map((reply) => reply.id),
  ]);

  const repliesByParent = new Map<string, PublicComment[]>();
  for (const reply of replies) {
    const key = reply.parentId!.toString();
    const list = repliesByParent.get(key) ?? [];
    list.push(toPublicComment(reply, liked.has(reply.id.toString())));
    repliesByParent.set(key, list);
  }

  return {
    comments: parents.map((parent) => ({
      ...toPublicComment(parent, liked.has(parent.id.toString())),
      replies: repliesByParent.get(parent.id.toString()) ?? [],
    })),
    total,
    page,
    limit,
    pageCount: Math.max(1, Math.ceil(total / limit)),
  };
}
