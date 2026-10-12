
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
}