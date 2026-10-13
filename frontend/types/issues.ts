
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
    location: {
        street?: string | null;
        city?: string;
        address: string;
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
