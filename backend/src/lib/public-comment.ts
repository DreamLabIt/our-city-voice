import type { Prisma } from "../generated/prisma/client.js";
import type { UserRole } from "../generated/prisma/enums.js";

export interface PublicComment {
  id: string;
  postId: string;
  message: string;
  likeCount: number;
  
  likedByMe: boolean;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: UserRole;
    
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