import type { Prisma } from "../generated/prisma/client.js";
import type { MediaType, PostPriority, PostStatus } from "../generated/prisma/enums.js";
import { mediaUrl } from "./media-url.js";

/**
 * The only post shape that leaves the API, and the select that feeds it.
 *
 * Same reasoning as lib/public-user.ts: going through one function is a habit,
 * and the habit is what stops a column reaching a response because somebody
 * forgot a `select` at one call site out of five.
 *
 * Two rules this file exists to enforce rather than document:
 *
 *   anonymity   a post with is_anonymous set has no author in the response.
 *               Not "an author the client should remember not to render" — the
 *               field is null and the name never leaves the process
 *   enums       status and priority are the database's own values, "in_progress"
 *               rather than "In Progress". An API that ships display strings
 *               makes itself the wrong place to change wording, and the role
 *               field already set this precedent
 */

/** Ids are strings for the reason given in lib/public-user.ts: 2^53. */
export interface PublicPost {
  id: string;
  /** The human-facing ticket number. The id is not in any URL. */
  trackingCode: string;
  title: string;
  description: string;
  status: PostStatus;
  priority: PostPriority;
  isAnonymous: boolean;

  category: { id: string; name: string; slug: string; icon: string };
  ward: { id: string; name: string; code: string };
  department: { id: string; name: string } | null;
  /** Null when the report is anonymous. See the note above. */
  author: { id: string; name: string; avatarUrl: string | null } | null;
  assignedOfficer: { id: string; name: string } | null;

  location: {
    street: string | null;
    city: string;
    address: string;
    postalCode: string | null;
    /**
     * Numbers, not the strings a Decimal column serialises to. Decimal(9,6) is
     * nine significant digits, well inside what a double represents exactly, so
     * there is nothing to lose and the frontend's own PostItem type already
     * declares `number | null`.
     */
    latitude: number | null;
    longitude: number | null;
  };

  counts: { views: number; likes: number; comments: number };

  /**
   * Whether the caller has liked this one. Always false for a signed-out
   * reader, which is also what the like button should show them.
   */
  likedByMe: boolean;

  /**
   * Enough media for a card, not the gallery. A list of twenty posts does not
   * need eighty media rows, and the detail view is where the gallery belongs.
   */
  media: {
    /** The first image by sort order, or null for a post with no image. */
    image: string | null;
    /** The first video, if there is one. */
    video: string | null;
    durationSecs: number | null;
    /** Everything attached, images and video, so a card can say "+3". */
    count: number;
  };

  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Passed to every query that returns a post.
 *
 * `media` is ordered and unbounded rather than `take: 1`, because a card needs
 * the first image *and* the first video and those can be any two rows. Posts
 * carry a handful of attachments, so this is a few rows per post, not a join
 * that grows with the table.
 */
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

/** Exactly what PUBLIC_POST_SELECT returns, so the mapper cannot drift from it. */
export type PostRow = Prisma.PostGetPayload<{ select: typeof PUBLIC_POST_SELECT }>;

/** Decimal | null -> number | null. Decimal has no implicit conversion. */
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
    // The whole point of the column. A client that forgets to check
    // isAnonymous still cannot render a name, because there is not one here.
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
      // A video's poster frame counts as the card image when there is no
      // standalone image row, which is how a video-only report gets a thumbnail.
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
