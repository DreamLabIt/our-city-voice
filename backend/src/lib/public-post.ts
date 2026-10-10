import type { Prisma } from "../generated/prisma/client.js";
import type { MediaType, PostPriority, PostStatus } from "../generated/prisma/enums.js";
import { mediaUrl } from "./media-url.js";

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

  location: {
    street: string | null;
    city: string;
    address: string;
    postalCode: string | null;
    
    latitude: number | null;
    longitude: number | null;
  };

  counts: { views: number; likes: number; comments: number };

  
  likedByMe: boolean;

  
  media: {
    
    image: string | null;
    
    video: string | null;
    durationSecs: number | null;
    
    count: number;
  };

  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
    select: { type: true, storageKey: true, thumbnailKey: true, durationSecs: true },
    orderBy: { sortOrder: "asc" },
  },
} satisfies Prisma.PostSelect;

export type PostRow = Prisma.PostGetPayload<{ select: typeof PUBLIC_POST_SELECT }>;

function toNumber(value: Prisma.Decimal | null): number | null {
  return value === null ? null : value.toNumber();
}

function firstOfType(
  media: PostRow["media"],
  type: MediaType,
): PostRow["media"][number] | undefined {
  return media.find((item) => item.type === type);
}

export function toPublicPost(post: PostRow, likedByMe = false): PublicPost {
  const image = firstOfType(post.media, "image");
  const video = firstOfType(post.media, "video");

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

    location: {
      street: post.street,
      city: post.city,
      address: post.address,
      postalCode: post.postalCode,
      latitude: toNumber(post.latitude),
      longitude: toNumber(post.longitude),
    },

    counts: {
      views: post.viewCount,
      likes: post.likeCount,
      comments: post.commentCount,
    },

    likedByMe,

    media: {
      image: image ? mediaUrl(image.storageKey) : video?.thumbnailKey
        ? mediaUrl(video.thumbnailKey)
        : null,
      video: video ? mediaUrl(video.storageKey) : null,
      durationSecs: video?.durationSecs ?? null,
      count: post.media.length,
    },

    resolvedAt: post.resolvedAt?.toISOString() ?? null,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  };
}

export interface PublicMediaItem {
  type: MediaType;
  url: string;
  
  thumbnailUrl: string | null;
  durationSecs: number | null;
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

export interface PublicPostDetail extends PublicPost {
  media: PublicPost["media"] & { gallery: PublicMediaItem[] };
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
  const base = toPublicPost(post, likedByMe);

  return {
    ...base,
    media: {
      ...base.media,
      gallery: post.media.map((item) => ({
        type: item.type,
        url: mediaUrl(item.storageKey),
        thumbnailUrl: item.thumbnailKey ? mediaUrl(item.thumbnailKey) : null,
        durationSecs: item.durationSecs,
      })),
    },
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