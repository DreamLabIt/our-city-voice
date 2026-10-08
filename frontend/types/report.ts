export type ReportStatus =
    | "pending"
    | "in_progress"
    | "resolved"
    | "rejected";

export type Priority =
    | "low"
    | "medium"
    | "high"
    | "critical";

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

export interface Ward {
    id: string;
    name: string;
    code: string;
}

export interface Department {
    id: string;
    name: string;
}

export interface Author {
    id: string;
    name: string;
    avatarUrl: string | null;
}

export interface Location {
    street: string | null;
    city: string;
    address: string;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
}

export interface Counts {
    views: number;
    likes: number;
    comments: number;
}

export interface Media {
    image: string | null;
    video: string | null;
    durationSecs: number | null;
    count: number;
}

export interface GalleryItem {
    type: "image" | "video";
    url: string;
    thumbnailUrl: string | null;
    durationSecs: number | null;
}

export interface TimelineEntry {
    id: string;
    fromStatus: ReportStatus | null;
    toStatus: ReportStatus;
    title: string;
    note: string | null;

    actor: {
        id: string;
        name: string;
    } | null;

    createdAt: string;
}

export interface Report {
    id: string;
    trackingCode: string;
    title: string;
    description: string;

    status: ReportStatus;
    priority: Priority;

    isAnonymous: boolean;

    category: Category;
    ward: Ward;

    department: Department | null;
    author: Author | null;
    assignedOfficer: Author | null;

    location: Location;

    counts: Counts;
    likedByMe: boolean;

    media: Media;

    resolvedAt: string | null;

    createdAt: string;
    updatedAt: string;
}

export interface ReportDetail extends Report {
    media: Media & {
        gallery: GalleryItem[];
    };

    timeline: TimelineEntry[];
}

export interface ReportListResponse {
    posts: Report[];
    total: number;
    page: number;
    limit: number;
    pageCount: number;
}

export interface ReportFiltersResponse {
    categories: {
        id: string;
        name: string;
        value: string;
        icon: string;
        postCount: number;
    }[];

    wards: {
        id: string;
        name: string;
        value: string;
        postCount: number;
    }[];

    statuses: {
        value: ReportStatus;
        postCount: number;
    }[];

    priorities: {
        value: Priority;
        postCount: number;
    }[];
}

export interface ReportDetailResponse {
    post: ReportDetail;
    related: Report[];
}

export interface ReportComment {
    id: string;
    postId: string;
    message: string;

    likeCount: number;
    likedByMe: boolean;

    author: {
        id: string;
        name: string;
        avatarUrl: string | null;
        role: "user" | "super_admin";
        departmentId: string | null;
    };

    createdAt: string;
    updatedAt: string;
}

export interface ReportCommentThread extends ReportComment {
    replies: ReportComment[];
}

export interface ReportCommentsResponse {
    comments: ReportCommentThread[];
    total: number;
    page: number;
    limit: number;
    pageCount: number;
}

export interface GetReportsParams {
    page?: number;
    limit?: number;

    sort?:
    | "newest"
    | "oldest"
    | "most_liked"
    | "most_commented"
    | "most_viewed"
    | "recently_updated";

    search?: string;

    category?: string | string[];
    ward?: string | string[];

    status?: ReportStatus | ReportStatus[];
    priority?: Priority | Priority[];

    mine?: boolean;
    authorId?: string;
    includeDeleted?: boolean;
}

export interface GetReportCommentsParams {
    page?: number;
    limit?: number;
}

export interface RecentPostsClientProps {
    initialPosts: Report[];
    tabs: string[];
}