import type { Prisma } from "../generated/prisma/client.js";
import type { MediaType, PostPriority, PostStatus } from "../generated/prisma/enums.js";
import { mediaUrl } from "./media-url.js";

/**
 * A report as the API ships it. Mirrors the Post model 1:1: the Post columns
 * (`street`/`city`/`address`/…, `viewCount`/`likeCount`/`commentCount`) stay
 * flat under their own names, reduced relation rows appear as the objects
 * below, and `media` is the Media relation itself rather than a summary. The
 * only field that is not a stored column is the computed `likedByMe`.
 */
export interface PublicPost {
  id: string;

  trackingCode: string;
  title: string;
  description: string;
  status: PostStatus;
  priority: PostPriority;
  isAnonymous: boolean;

  category: { id: string; name: string; slug: string; icon: string };
  ward: { id: string; name: string; code: string };
  department: { id: string; name: string } | null;

  author: { id: string; name: string; avatarUrl: string | null } | null;
  assignedOfficer: { id: string; name: string } | null;

  // Post columns, flat and untranslated.
  street: string | null;
  city: string;
  address: string;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;

  viewCount: number;
  likeCount: number;
  commentCount: number;

  likedByMe: boolean;

  // The Media relation, one entry per row, in display (sortOrder) order.
  media: PublicMediaItem[];

  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * One Media row. `storageKey` holds a bucket key (or a fixture path), never a
 * URL; `url`/`thumbnailUrl` are built from it at read time so a bucket or CDN
 * change never rewrites stored rows. `sizeBytes` is a BigInt and so a string
 * on the wire, exactly like the ids.
 */
export interface PublicMediaItem {
  id: string;
  type: MediaType;
  storageKey: string;
  thumbnailKey: string | null;
  mimeType: string;
  sizeBytes: string;
  durationSecs: number | null;
  sortOrder: number;
  url: string;
  thumbnailUrl: string | null;
}

export const PUBLIC_POST_SELECT = {
  id: true,
  trackingCode: true,
  title: true,
  description: true,
  status: true,
  priority: true,
  isAnonymous: true,
  street: true,
  city: true,
  address: true,
  postalCode: true,
  latitude: true,
  longitude: true,
  viewCount: true,
  likeCount: true,
  commentCount: true,
  resolvedAt: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true, slug: true, icon: true } },
  ward: { select: { id: true, name: true, code: true } },
  department: { select: { id: true, name: true } },
  author: { select: { id: true, name: true, avatarUrl: true } },
  assignedOfficer: { select: { id: true, name: true } },
  media: {
    select: {
      id: true,
      type: true,
      storageKey: true,
      thumbnailKey: true,
      mimeType: true,
      sizeBytes: true,
      durationSecs: true,
      sortOrder: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.PostSelect;

export type PostRow = Prisma.PostGetPayload<{ select: typeof PUBLIC_POST_SELECT }>;

function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

function toPublicMediaItem(item: PostRow["media"][number]): PublicMediaItem {
  return {
    id: item.id.toString(),
    type: item.type,
    storageKey: item.storageKey,
    thumbnailKey: item.thumbnailKey,
    mimeType: item.mimeType,
    sizeBytes: item.sizeBytes.toString(),
    durationSecs: item.durationSecs,
    sortOrder: item.sortOrder,
    url: mediaUrl(item.storageKey),
    thumbnailUrl: item.thumbnailKey ? mediaUrl(item.thumbnailKey) : null,
  };
}

export function toPublicPost(post: PostRow, likedByMe = false): PublicPost {
  return {
    id: post.id.toString(),
    trackingCode: post.trackingCode,
    title: post.title,
    description: post.description,
    status: post.status,
    priority: post.priority,
    isAnonymous: post.isAnonymous,

    category: {
      id: post.category.id.toString(),
      name: post.category.name,
      slug: post.category.slug,
      icon: post.category.icon,
    },
    ward: {
      id: post.ward.id.toString(),
      name: post.ward.name,
      code: post.ward.code,
    },
    department: post.department
      ? { id: post.department.id.toString(), name: post.department.name }
      : null,
    author: post.isAnonymous
      ? null
      : {
          id: post.author.id.toString(),
          name: post.author.name,
          avatarUrl: post.author.avatarUrl,
        },
    assignedOfficer: post.assignedOfficer
      ? { id: post.assignedOfficer.id.toString(), name: post.assignedOfficer.name }
      : null,

    street: post.street,
    city: post.city,
    address: post.address,
    postalCode: post.postalCode,
    latitude: toNumber(post.latitude),
    longitude: toNumber(post.longitude),

    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,

    likedByMe,

    media: post.media.map(toPublicMediaItem),

    resolvedAt: post.resolvedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export interface PublicTimelineEntry {
  id: string;
  fromStatus: PostStatus | null;
  toStatus: PostStatus;
  title: string;
  note: string | null;
  actor: { id: string; name: string } | null;
  createdAt: string;
}

/**
 * A `PublicPost` plus the append-only status timeline. Media is already the
 * full set of rows on `PublicPost`, so a detail only adds `timeline` rather
 * than re-shipping a gallery alongside a summary.
 */
export interface PublicPostDetail extends PublicPost {
  timeline: PublicTimelineEntry[];
}

export const PUBLIC_POST_DETAIL_SELECT = {
  ...PUBLIC_POST_SELECT,
  statusHistory: {
    select: {
      id: true,
      fromStatus: true,
      toStatus: true,
      title: true,
      note: true,
      actor: { select: { id: true, name: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  },
} satisfies Prisma.PostSelect;

export type PostDetailRow = Prisma.PostGetPayload<{
  select: typeof PUBLIC_POST_DETAIL_SELECT;
}>;

export function toPublicPostDetail(post: PostDetailRow, likedByMe = false): PublicPostDetail {
  return {
    ...toPublicPost(post, likedByMe),
    timeline: post.statusHistory.map((entry) => ({
      id: entry.id.toString(),
      fromStatus: entry.fromStatus,
      toStatus: entry.toStatus,
      title: entry.title,
      note: entry.note,
      actor:
        entry.actor && !(post.isAnonymous && entry.actor.id === post.author.id)
          ? { id: entry.actor.id.toString(), name: entry.actor.name }
          : null,
      createdAt: entry.createdAt.toISOString(),
    })),
  };
}