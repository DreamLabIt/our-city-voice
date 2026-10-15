export interface ContactCategory {
    id: string;
    name: string;
}

export interface ContactCategoriesResponse {
    success: boolean;
    categories: ContactCategory[];
    error?: string;
}

export interface SendContactMessagePayload {
    name: string;
    email: string;
    phone?: string | null;
    categoryId: string;
    subject: string;
    message: string;
}

export interface ContactMessage {
    id: string;
    category: ContactCategory;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    handledAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface SendContactMessageResponse {
    success: boolean;
    data?: ContactMessage;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    rateLimited?: boolean;
    retryAfterSeconds?: number;
}

export interface GetAdminContactMessagesParams {
    page?: number;
    limit?: number;
}

export interface GetAdminContactMessagesResponse {
    success: boolean;
    messages: ContactMessage[];
    total: number;
    page: number;
    limit: number;
    pageCount: number;
    error?: string;
    requiresAuth?: boolean;
}