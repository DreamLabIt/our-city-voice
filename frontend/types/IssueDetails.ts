import type {
    Report,
    ReportCommentThread,
    ReportDetail,
} from "@/types/report";

export type ReportStatus = "pending" | "in_progress" | "resolved" | "rejected";
export type PriorityLevel = "low" | "medium" | "high" | "critical";

export interface IssueTimelineEntry {
    id: string;
    status: ReportStatus;
    title?: string;
    note?: string | null;
    createdAt: string;
    actor?: string | null;
}

export interface IssueSummary {
    id: string;
    trackingCode: string;
    title: string;
    description: string;
    status: ReportStatus;
    priority: PriorityLevel;
    isAnonymous: boolean;
    likedByMe: boolean;
    createdAt: string;
    updatedAt: string;
    resolvedAt: string | null;
    author: { id: string; name: string; avatarUrl: string | null } | null;
    category: { id: string; name: string; slug: string; icon: string };
    department: { id: string; name: string } | null;
    assignedOfficer: { id: string; name: string } | null;
    ward: { id: string; name: string; code: string } | null;
    counts: { views: number; likes: number; comments: number };
    location: {
        street: string;
        city: string;
        address: string;
        postalCode: string;
        latitude: number;
        longitude: number;
    };
    media: {
        image: string;
        video?: string | null;
        durationSecs?: number | null;
        count?: number;
        gallery: string[];
    };
}

export interface Issue extends IssueSummary {
    timeline: IssueTimelineEntry[];
}

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
