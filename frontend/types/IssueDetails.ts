import type {
    Report,
    ReportCommentThread,
    ReportDetail,
} from "@/types/report";

export interface IssueComment {
    id: string;
    postId: string;
    message: string;
    likeCount: number;
    likedByMe: boolean;
    createdAt?: string;
    isOfficial?: boolean;
    author?: {
        id: string;
        name: string;
        avatarUrl?: string | null;
        role?: string | null;
    } | null;
    replies?: IssueComment[];
}


export interface IssuePageProps {
    params: Promise<{ id: string }>;
}

export interface IssueDetailsProps {
    post: ReportDetail;
    comments: ReportCommentThread[];
    relatedPosts: Report[];
}


export interface MediaItem {
    type: "video" | "image";
    src: string;
    poster?: string;
}

export interface PostProps {
    post: ReportDetail;
}


export interface RelatedPostsProps {
    relatedPosts: Report[];
}

export interface CommentsProps {
    postId: string;
    comments: IssueComment[];
}

export interface CommentItemProps {
    comment: IssueComment;
    isReply?: boolean;
    onLike: (id: string) => void;
    onReply: (parentId: string, message: string) => void;
}