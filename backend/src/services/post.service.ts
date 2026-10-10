import { randomInt } from "node:crypto";

import { prisma } from "../db/prisma.js";
import type { Prisma } from "../generated/prisma/client.js";
import type { MediaType, PostPriority, PostStatus } from "../generated/prisma/enums.js";
import { AppError } from "../lib/errors.js";
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

  const media = input.media?.map((item, index) => ({
    type: item.type,
    storageKey: item.url,
    thumbnailKey: item.thumbnailUrl ?? null,
    mimeType: item.mimeType?.trim() || DEFAULT_MEDIA_TYPE[item.type],
    sizeBytes: BigInt(item.sizeBytes ?? 0),
    durationSecs: item.durationSecs ?? null,
    sortOrder: index,
  }));

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