"use server";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import { AddCommentPayload, AddCommentResponse, LikeToggleResponse, LikeApiData, LikeRequestOptions } from "@/types/commentsLikes";

const COMMENT_MAX_LENGTH = 2000;

function normalizeReportCode(code: string): string | null {
    const value = code.trim();
    return value ? value : null;
}

function normalizeCommentId(
    commentId: string | number,
): string | null {
    const value = String(commentId).trim();

    return /^\d+$/.test(value) ? value : null;
}

function getFieldErrors(
    details: unknown,
): Record<string, string[]> | undefined {
    if (!details || typeof details !== "object" || Array.isArray(details)) {
        return undefined;
    }

    const fieldErrors: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(details)) {
        if (
            Array.isArray(value) &&
            value.every((item) => typeof item === "string")
        ) {
            fieldErrors[key] = value;
        }
    }

    return Object.keys(fieldErrors).length > 0
        ? fieldErrors
        : undefined;
}

async function sendLikeRequest(
    options: LikeRequestOptions,
): Promise<LikeToggleResponse> {
    try {
        const token = await getAccessToken();

        if (!token?.trim()) {
            return {
                success: false,
                requiresAuth: true,
                error: options.loginMessage,
            };
        }

        const result = await apiFetch<LikeApiData>(options.path, {
            method: options.method,
            token: token.trim(),
            forward: await clientForwardHeaders(),
        });

        if (!result.ok) {
            if (result.status === 401) {
                return {
                    success: false,
                    requiresAuth: true,
                    error: "Session expired. Please log in again.",
                };
            }

            if (result.status === 404) {
                return {
                    success: false,
                    error: options.notFoundMessage,
                };
            }

            return {
                success: false,
                error: result.error?.message || options.fallbackError,
            };
        }

        const data = result.data;

        if (
            !data ||
            typeof data.likedByMe !== "boolean" ||
            !Number.isInteger(data.likeCount) ||
            data.likeCount < 0
        ) {
            return {
                success: false,
                error: "The server returned an invalid like response.",
            };
        }

        return {
            success: true,
            likedByMe: data.likedByMe,
            likeCount: data.likeCount,
        };
    } catch (error) {
        console.error(
            `Error in ${options.method} ${options.path} server action:`,
            error,
        );

        return {
            success: false,
            error: "An unexpected error occurred.",
        };
    }
}

export async function addReportComment(
    code: string,
    payload: AddCommentPayload,
): Promise<AddCommentResponse> {
    try {
        const normalizedCode = normalizeReportCode(code);

        if (!normalizedCode) {
            return {
                success: false,
                error: "Invalid report.",
            };
        }

        const message =
            payload && typeof payload.message === "string"
                ? payload.message.trim()
                : "";

        if (!message) {
            return {
                success: false,
                fieldErrors: {
                    message: ["Comment cannot be empty."],
                },
            };
        }

        if (message.length > COMMENT_MAX_LENGTH) {
            return {
                success: false,
                fieldErrors: {
                    message: [
                        `Comment cannot exceed ${COMMENT_MAX_LENGTH} characters.`,
                    ],
                },
            };
        }

        const token = await getAccessToken();

        if (!token?.trim()) {
            return {
                success: false,
                requiresAuth: true,
                error: "Please log in to add a comment.",
            };
        }

        const result = await apiFetch<{ comment: Comment }>(
            `/posts/${encodeURIComponent(normalizedCode)}/comments`,
            {
                method: "POST",
                token: token.trim(),
                forward: await clientForwardHeaders(),
                body: JSON.stringify({ message }),
            },
        );

        if (!result.ok) {
            if (result.status === 401) {
                return {
                    success: false,
                    requiresAuth: true,
                    error: "Session expired. Please log in again.",
                };
            }

            if (result.status === 404) {
                return {
                    success: false,
                    error: "This report no longer exists.",
                };
            }

            return {
                success: false,
                error: result.error?.message || "Failed to add comment.",
                fieldErrors: getFieldErrors(result.error),
            };
        }

        if (!result.data?.comment) {
            return {
                success: false,
                error: "The comment was submitted, but the server returned an invalid response.",
            };
        }

        return {
            success: true,
            comment: result.data.comment,
        };
    } catch (error) {
        console.error("Error in addReportComment server action:", error);

        return {
            success: false,
            error: "An unexpected error occurred while adding the comment.",
        };
    }
}

export async function likeReport(
    code: string,
): Promise<LikeToggleResponse> {
    const normalizedCode = normalizeReportCode(code);

    if (!normalizedCode) {
        return {
            success: false,
            error: "Invalid report.",
        };
    }

    return sendLikeRequest({
        path: `/posts/${encodeURIComponent(normalizedCode)}/like`,
        method: "POST",
        loginMessage: "Please log in to like this report.",
        fallbackError: "Failed to like report.",
        notFoundMessage: "This report no longer exists.",
        defaultLikedByMe: true,
    });
}

export async function unlikeReport(
    code: string,
): Promise<LikeToggleResponse> {
    const normalizedCode = normalizeReportCode(code);

    if (!normalizedCode) {
        return {
            success: false,
            error: "Invalid report.",
        };
    }

    return sendLikeRequest({
        path: `/posts/${encodeURIComponent(normalizedCode)}/like`,
        method: "DELETE",
        loginMessage: "Please log in to unlike this report.",
        fallbackError: "Failed to remove like.",
        notFoundMessage: "This report no longer exists.",
        defaultLikedByMe: false,
    });
}

export async function likeComment(
    code: string,
    commentId: string | number,
): Promise<LikeToggleResponse> {
    const normalizedCode = normalizeReportCode(code);
    const id = normalizeCommentId(commentId);

    if (!normalizedCode || !id) {
        return {
            success: false,
            error: "Invalid report or comment.",
        };
    }

    return sendLikeRequest({
        path: `/posts/${encodeURIComponent(normalizedCode)}/comments/${id}/like`,
        method: "POST",
        loginMessage: "Please log in to like this comment.",
        fallbackError: "Failed to like comment.",
        notFoundMessage: "This comment no longer exists.",
        defaultLikedByMe: true,
    });
}

export async function unlikeComment(
    code: string,
    commentId: string | number,
): Promise<LikeToggleResponse> {
    const normalizedCode = normalizeReportCode(code);
    const id = normalizeCommentId(commentId);

    if (!normalizedCode || !id) {
        return {
            success: false,
            error: "Invalid report or comment.",
        };
    }

    return sendLikeRequest({
        path: `/posts/${encodeURIComponent(normalizedCode)}/comments/${id}/like`,
        method: "DELETE",
        loginMessage: "Please log in to unlike this comment.",
        fallbackError: "Failed to remove like from comment.",
        notFoundMessage: "This comment no longer exists.",
        defaultLikedByMe: false,
    });
}