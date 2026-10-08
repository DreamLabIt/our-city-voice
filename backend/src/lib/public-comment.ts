import type { Prisma } from "../generated/prisma/client.js";
import type { UserRole } from "../generated/prisma/enums.js";

/**
 * A comment on a report, as it leaves the API.
 *
 * One level of nesting. The column allows any depth and the service layer is
 * what holds the line, so this type does too: a reply has no `replies` of its
 * own, which makes a three-deep thread unrepresentable rather than merely
 * discouraged.
 *
 * `role` is the author's account role, "user" or "super_admin", and not one of
 * the display labels the mock data uses ("Resident", "Municipal Officer"). Those
 * describe a person's relationship to a report, which nothing in the schema
 * records. See api-doc.md.
 */
export interface PublicComment {
  id: string;
  postId: string;
  message: string;
  likeCount: number;
  /** Whether the caller has liked it. Always false when signed out. */
  likedByMe: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: UserRole;
    /** Set when the author belongs to a department, which is what makes a
     * comment official. Null for a resident. */
    departmentId: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface PublicCommentThread extends PublicComment {
  replies: PublicComment[];
}

export const PUBLIC_COMMENT_SELECT = {
  id: true,
  postId: true,
  message: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
  author: {
    select: { id: true, name: true, avatarUrl: true, role: true, departmentId: true },
  },
} satisfies Prisma.CommentSelect;

export type CommentRow = Prisma.CommentGetPayload<{ select: typeof PUBLIC_COMMENT_SELECT }>;

export function toPublicComment(comment: CommentRow, likedByMe = false): PublicComment {
  return {
    id: comment.id.toString(),
    postId: comment.postId.toString(),
    message: comment.message,
    likeCount: comment.likeCount,
    likedByMe,
    author: {
      id: comment.author.id.toString(),
      name: comment.author.name,
      avatarUrl: comment.author.avatarUrl,
      role: comment.author.role,
      departmentId: comment.author.departmentId?.toString() ?? null,
    },
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  };
}
