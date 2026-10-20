import { AuthUser } from ".";

export interface UploadedMediaItem {
    url: string;
    type: "image" | "video";
    thumbnailUrl?: string | null;
    mimeType?: string;
    sizeBytes?: number;
    durationSecs?: number | null;
}

export interface ReportIssueFormData {
    title: string;
    description: string;
    category: string;
    ward: string;
    priority?: "low" | "medium" | "high" | "critical" | string;
    isAnonymous?: boolean;
    location?: {
        city?: string;
        address?: string;
        street?: string | null;
        postalCode?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    };
    media?: UploadedMediaItem[];
}

export interface CreateIssueResult {
    success: boolean;
    data?: any;
    error?: string;
    fieldErrors?: Record<string, string[] | string>;
    requiresAuth?: boolean
}

export interface ReportFormProps {
    reportFilters: {
        categories: Array<{ name: string; value: string }>;
        wards: Array<{ name: string; code?: string; value?: string }>;
    };
    user?: AuthUser | null;
}

export interface FormValues {
    title: string;
    description: string;
    category: string;
    ward: string;
    priority: "low" | "medium" | "high" | "critical";
    isAnonymous: boolean;
    location: {
        address: string;
        city: string;
        street: string;
        postalCode: string;
        latitude: number | null;
        longitude: number | null;
    };
}

export interface IssuesPageProps {
    searchParams: Promise<{
        page?: string;
        search?: string;
        category?: string;
        status?: string;
        ward?: string;
    }>;
}

export interface IssuesFilters {
    searchQuery: string;
    selectedCategory: string;
    selectedStatus: string;
    selectedWard: string;
    categories: Array<{ slug: string; name: string }>;
    statuses: string[];
    wards: Array<{ code: string; name: string }>;
}

export interface IssuesTableProps {
    issues: Report[];
    total: number;
    currentPage: number;
    totalPages: number;
    isAdmin: boolean;
    basePath: string;
    baseQuery: string;
    filters: IssuesFilters;
}


export const VALID_PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical",
] as const;

export type ReportPriority = (typeof VALID_PRIORITIES)[number];


export interface ReportMediaInput {
    url: string;
    type: "image" | "video";
    thumbnailUrl?: string | null;
    mimeType?: string;
    sizeBytes: number;
    durationSecs: number | null;
}

export interface UpdateReportInput {
    title?: string;
    description?: string;
    category?: string;
    ward?: string;
    priority?: ReportPriority;
    isAnonymous?: boolean;
    location?: {
        street?: string | null;
        city?: string;
        address?: string;
        postalCode?: string | null;
        latitude?: number | null;
        longitude?: number | null;
    };
    media?: ReportMediaInput[];
}

export interface MutationResult {
    success: boolean;
    error?: string;
    requiresAuth?: boolean;
    fieldErrors?: Record<string, string[]>;
}

export interface EditOption {
    value: string;
    name: string;
}

export interface IssuesEditOptions {
    categories: EditOption[];
    wards: EditOption[];
}

export interface IssueRowActionsProps {
    issue: Report;
    categories: EditOption[];
    wards: EditOption[];
}

export interface EditState {
    title: string;
    description: string;
    category: string;
    ward: string;
    priority: ReportPriority;
    isAnonymous: boolean;
    city: string;
    address: string;
    street: string;
    postalCode: string;
}

export interface StatusBadgeSelectProps {
    trackingCode: string;
    currentStatus: string;
    isAdmin?: boolean;
}
