import { randomInt } from "node:crypto";

import { prisma } from "../db/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { MediaType, PostPriority, PostStatus, UserRole } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { isUniqueViolation } from "../lib/prisma-errors.js";
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
  
  category?: string[] | undefined;
  
  ward?: string[] | undefined;
  status?: PostStatus[] | undefined;
  priority?: PostPriority[] | undefined;
  
  authorId?: bigint | undefined;
  
  includeDeleted?: boolean | undefined;
}

export interface ListPostsResult {
  posts: PublicPost[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

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
    ...(includeDeleted ? {} : { deletedAt: null }),
    ...(status?.length ? { status: { in: status } } : {}),
    ...(priority?.length ? { priority: { in: priority } } : {}),
    ...(category?.length ? { category: { slug: { in: category } } } : {}),
    ...(ward?.length ? { ward: { code: { in: ward } } } : {}),
    ...(authorId !== undefined ? { userId: authorId } : {}),
    ...(search
      ? {
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

export interface FilterOption {
  id: string;
  name: string;
  
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

export async function listFilterOptions(): Promise<FilterOptions> {
  const where: Prisma.PostWhereInput = { deletedAt: null };

  const [categories, wards, byCategory, byWard, byStatus, byPriority] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true, icon: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }),
    prisma.ward.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    }),
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

export type PostIdentifier = { trackingCode: string } | { id: bigint };

export interface GetPostOptions {
  
  includeDeleted?: boolean | undefined;
  
  countView?: boolean | undefined;
}

export interface GetPostResult {
  post: PublicPostDetail;
  
  related: PublicPost[];
}

const RELATED_LIMIT = 4;

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

  const post = await prisma.post.findFirst({ where, select: PUBLIC_POST_DETAIL_SELECT });

  if (!post) throw AppError.notFound("No report with that tracking code");

  
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

export interface CreatePostMediaInput {
  url: string;
  type: MediaType;
  thumbnailUrl?: string | null | undefined;
  mimeType?: string | null | undefined;
  sizeBytes?: number | null | undefined;
  durationSecs?: number | null | undefined;
}

export interface CreatePostLocationInput {
  street?: string | null | undefined;
  city: string;
  address: string;
  postalCode?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}

export interface CreatePostInput {
  title: string;
  description: string;
  category: string;
  ward: string;
  priority?: PostPriority | undefined;
  isAnonymous?: boolean | undefined;
  location: CreatePostLocationInput;
  media?: CreatePostMediaInput[] | undefined;
}

const OPENING_STATUS: PostStatus = "pending";
const DEFAULT_MEDIA_TYPE: Record<MediaType, string> = {
  image: "image/jpeg",
  video: "video/mp4",
};

function generateTrackingCode(year: number): string {
  const serial = randomInt(1, 1_000_000).toString().padStart(6, "0");
  return `OCV-${year}-${serial}`;
}

function unknownField(field: string, value: string, collection: string): AppError {
  return AppError.badRequest("Some fields need attention", {
    [field]: [`No ${collection} with the value "${value}". See GET /posts/filters for the valid options.`],
  });
}

/**
 * Maps the request's already-uploaded media onto `Media` rows. The schema keeps
 * a bucket key, not a URL, but an upload arrives as a finished Cloudinary URL
 * and `mediaUrl()` passes an absolute URL through untouched, so the URL is what
 * gets stored. `sortOrder` follows the array, which is the display order.
 */
function buildMediaRows(items: CreatePostMediaInput[]) {
  return items.map((item, index) => ({
    type: item.type,
    storageKey: item.url,
    thumbnailKey: item.thumbnailUrl ?? null,
    mimeType: item.mimeType?.trim() || DEFAULT_MEDIA_TYPE[item.type],
    sizeBytes: BigInt(item.sizeBytes ?? 0),
    durationSecs: item.durationSecs ?? null,
    sortOrder: index,
  }));
}

export async function createPost(userId: bigint, input: CreatePostInput): Promise<PublicPost> {
  const [category, ward] = await Promise.all([
    prisma.category.findUnique({
      where: { slug: input.category },
      select: { id: true, defaultDepartmentId: true },
    }),
    prisma.ward.findUnique({ where: { code: input.ward }, select: { id: true } }),
  ]);

  if (!category) throw unknownField("category", input.category, "category");
  if (!ward) throw unknownField("ward", input.ward, "ward");

  const media = input.media ? buildMediaRows(input.media) : undefined;

  const year = new Date().getFullYear();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const created = await tx.post.create({
          data: {
            trackingCode: generateTrackingCode(year),
            title: input.title,
            description: input.description,
            userId,
            categoryId: category.id,
            wardId: ward.id,
            departmentId: category.defaultDepartmentId,
            priority: input.priority ?? "medium",
            isAnonymous: input.isAnonymous ?? false,
            street: input.location.street?.trim() || null,
            city: input.location.city,
            address: input.location.address,
            postalCode: input.location.postalCode?.trim() || null,
            latitude: input.location.latitude ?? null,
            longitude: input.location.longitude ?? null,
            ...(media?.length ? { media: { create: media } } : {}),
          },
          select: PUBLIC_POST_SELECT,
        });

        await tx.postStatusHistory.create({
          data: {
            postId: created.id,
            actorId: userId,
            fromStatus: null,
            toStatus: OPENING_STATUS,
            title: "Report submitted",
            note: "Received and queued for triage.",
          },
        });

        return toPublicPost(created, false);
      });
    } catch (error) {
      if (isUniqueViolation(error)) continue;
      throw error;
    }
  }

  throw AppError.serviceUnavailable("Could not assign a tracking code. Please try again.");
}

/** The signed-in caller on a write, reduced to what authorisation needs. */
export interface PostActor {
  id: bigint;
  role: UserRole;
}

export interface UpdatePostLocationInput {
  street?: string | null | undefined;
  city?: string | undefined;
  address?: string | undefined;
  postalCode?: string | null | undefined;
  latitude?: number | null | undefined;
  longitude?: number | null | undefined;
}

export interface UpdatePostInput {
  title?: string | undefined;
  description?: string | undefined;
  category?: string | undefined;
  ward?: string | undefined;
  priority?: PostPriority | undefined;
  isAnonymous?: boolean | undefined;
  location?: UpdatePostLocationInput | undefined;
  media?: CreatePostMediaInput[] | undefined;
}

/**
 * A write that a caller is not allowed to make is a `403`; a report that is not
 * there (never existed, or was moderated away) is a `404`. Both an edit and a
 * delete start by looking the row up without the `deletedAt` filter so the two
 * cases stay distinguishable, then treat a soft-deleted report as gone.
 */
async function findPostForWrite(
  identifier: PostIdentifier,
): Promise<{ id: bigint; userId: bigint; categoryId: bigint; deletedAt: Date | null }> {
  const post = await prisma.post.findFirst({
    where: identifier,
    select: { id: true, userId: true, categoryId: true, deletedAt: true },
  });

  if (!post) throw AppError.notFound("No report with that tracking code");
  return post;
}

export async function updatePost(
  actor: PostActor,
  identifier: PostIdentifier,
  input: UpdatePostInput,
): Promise<PublicPost> {
  const post = await findPostForWrite(identifier);

  // Editing a moderated-away report has no public effect; it must be restored
  // first (no restore endpoint yet), so it reads as gone here too.
  if (post.deletedAt !== null) {
    throw AppError.notFound("No report with that tracking code");
  }

  if (post.userId !== actor.id && actor.role !== "super_admin") {
    throw AppError.forbidden("You can only edit a report you filed");
  }

  const data: Prisma.PostUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.isAnonymous !== undefined) data.isAnonymous = input.isAnonymous;

  const [category, ward] = await Promise.all([
    input.category === undefined
      ? Promise.resolve(null)
      : prisma.category.findUnique({
          where: { slug: input.category },
          select: { id: true, defaultDepartmentId: true },
        }),
    input.ward === undefined
      ? Promise.resolve(null)
      : prisma.ward.findUnique({ where: { code: input.ward }, select: { id: true } }),
  ]);

  if (input.category !== undefined && !category) {
    throw unknownField("category", input.category, "category");
  }
  if (input.ward !== undefined && !ward) {
    throw unknownField("ward", input.ward, "ward");
  }

  if (category) {
    data.category = { connect: { id: category.id } };
    // Routing follows the category, so the department moves with it — but only
    // when the category actually changes, or a no-op send would clobber a
    // department an officer reassigned by hand.
    if (category.id !== post.categoryId) {
      data.department = category.defaultDepartmentId
        ? { connect: { id: category.defaultDepartmentId } }
        : { disconnect: true };
    }
  }
  if (ward) data.ward = { connect: { id: ward.id } };

  const location = input.location;
  if (location) {
    if (location.street !== undefined) data.street = location.street?.trim() || null;
    if (location.city !== undefined) data.city = location.city;
    if (location.address !== undefined) data.address = location.address;
    if (location.postalCode !== undefined) data.postalCode = location.postalCode?.trim() || null;
    // Coordinates are a pair: sending either replaces both, and null clears.
    if (location.latitude !== undefined || location.longitude !== undefined) {
      data.latitude = location.latitude ?? null;
      data.longitude = location.longitude ?? null;
    }
  }

  const media = input.media === undefined ? undefined : buildMediaRows(input.media);

  const updated = await prisma.$transaction(async (tx) => {
    if (media !== undefined) {
      // Replace the whole set: the edit form sends what should remain. An
      // empty array therefore clears the attachments.
      await tx.media.deleteMany({ where: { postId: post.id } });
      if (media.length) data.media = { create: media };
    }

    return tx.post.update({ where: { id: post.id }, data, select: PUBLIC_POST_SELECT });
  });

  const liked = await likedPostIds(actor.id, [post.id]);

  logger.info(
    { postId: post.id.toString(), actorId: actor.id.toString(), fields: Object.keys(data) },
    "report updated",
  );

  return toPublicPost(updated, liked.has(post.id.toString()));
}

export async function deletePost(actor: PostActor, identifier: PostIdentifier): Promise<void> {
  const post = await findPostForWrite(identifier);

  // Already gone. Same answer as a code that never existed.
  if (post.deletedAt !== null) {
    throw AppError.notFound("No report with that tracking code");
  }

  if (post.userId !== actor.id && actor.role !== "super_admin") {
    throw AppError.forbidden("You can only delete a report you filed");
  }

  await prisma.post.update({
    where: { id: post.id },
    data: { deletedAt: new Date() },
  });

  logger.info(
    { postId: post.id.toString(), actorId: actor.id.toString() },
    "report soft-deleted",
  );
}

export interface ListCommentsOptions {
  page: number;
  limit: number;
}

export interface ListCommentsResult {
  comments: PublicCommentThread[];
  
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

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