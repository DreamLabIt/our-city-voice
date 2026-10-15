"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type { IssueComment } from "@/types/IssueDetails";
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

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function getApiErrorMessage(result: unknown, fallback: string): string {
    const root = asRecord(result);
    const error = root?.error;

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    const errorMessage = asRecord(error)?.message;

    if (typeof errorMessage === "string" && errorMessage.trim()) {
        return errorMessage;
    }

    if (typeof root?.message === "string" && root.message.trim()) {
        return root.message;
    }

    return fallback;
}

function toFieldErrors(
    details: unknown,
): Record<string, string[]> | undefined {
    const record = asRecord(details);

    if (!record) return undefined;

    const fieldErrors: Record<string, string[]> = {};

    for (const [key, value] of Object.entries(record)) {
        if (
            Array.isArray(value) &&
            value.every((item) => typeof item === "string")
        ) {
            fieldErrors[key] = value;
        } else if (typeof value === "string") {
            fieldErrors[key] = [value];
        }
    }

    return Object.keys(fieldErrors).length > 0
        ? fieldErrors
        : undefined;
}

function getFieldErrors(
    result: unknown,
): Record<string, string[]> | undefined {
    const root = asRecord(result);

    return (
        toFieldErrors(root?.details) ??
        toFieldErrors(asRecord(root?.error)?.details)
    );
}

async function sendLikeRequest(
    options: LikeRequestOptions,
    reportCode?: string,
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
                error: getApiErrorMessage(result, options.fallbackError),
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

        if (reportCode) {
            revalidatePath("/");
            revalidatePath("/reports");
            revalidatePath(`/issues/${reportCode}`);
            revalidatePath("/dashboard/issues");
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

        const result = await apiFetch<{ comment: IssueComment }>(
            `/posts/${encodeURIComponent(normalizedCode)}/comments`,
            {
                method: "POST",
                token: token.trim(),
                forward: await clientForwardHeaders(),
                body: { message },
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

            console.error(
                "addReportComment failed:",
                result.status,
                JSON.stringify(result),
            );

            return {
                success: false,
                error: getApiErrorMessage(result, "Failed to add comment."),
                fieldErrors: getFieldErrors(result),
            };
        }

        if (!result.data?.comment) {
            return {
                success: false,
                error: "The comment was submitted, but the server returned an invalid response.",
            };
        }

        revalidatePath("/");
        revalidatePath("/reports");
        revalidatePath(`/issues/${normalizedCode}`);
        revalidatePath("/dashboard/issues");


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
    }, normalizedCode);
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
    }, normalizedCode);
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
    }, normalizedCode);
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
    }, normalizedCode);
}