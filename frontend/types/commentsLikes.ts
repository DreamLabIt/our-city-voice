import { IssueComment } from "./IssueDetails";

export interface AddCommentPayload {
    message: string;
}

export interface AddCommentResponse {
    success: boolean;
    error?: string;
    fieldErrors?: Record<string, string[]>;
    requiresAuth?: boolean;
    comment?: IssueComment;
}

export interface LikeToggleResponse {
    success: boolean;
    likedByMe?: boolean;
    likeCount?: number;
    error?: string;
    requiresAuth?: boolean;
}


export interface LikeApiData {
    likedByMe: boolean;
    likeCount: number;
}

export interface LikeRequestOptions {
    path: string;
    method: "POST" | "DELETE";
    loginMessage: string;
    fallbackError: string;
    notFoundMessage: string;
    defaultLikedByMe: boolean;
}