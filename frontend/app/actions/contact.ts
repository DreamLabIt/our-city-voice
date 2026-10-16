"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type { ContactCategory, ContactCategoriesResponse, SendContactMessagePayload, ContactMessage, SendContactMessageResponse, GetAdminContactMessagesParams, GetAdminContactMessagesResponse } from "@/types/contact";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const MAX_NAME_LENGTH = 120;
const MAX_EMAIL_LENGTH = 254;
const MAX_PHONE_LENGTH = 32;
const MAX_SUBJECT_LENGTH = 160;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;

function asRecord(
    value: unknown,
): Record<string, unknown> | null {
    return value &&
        typeof value === "object" &&
        !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function getApiErrorMessage(
    result: unknown,
    fallback: string,
): string {
    const root = asRecord(result);
    const error = root?.error;

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    const errorMessage = asRecord(error)?.message;

    if (
        typeof errorMessage === "string" &&
        errorMessage.trim()
    ) {
        return errorMessage;
    }

    if (
        typeof root?.message === "string" &&
        root.message.trim()
    ) {
        return root.message;
    }

    return fallback;
}

function toFieldErrors(
    details: unknown,
): Record<string, string[]> | undefined {
    const record = asRecord(details);

    if (!record) {
        return undefined;
    }

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

function normalizePage(
    value: unknown,
    fallback: number,
): number {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 1
    ) {
        return fallback;
    }

    return value;
}

function normalizeLimit(value: unknown): number {
    if (
        typeof value !== "number" ||
        !Number.isFinite(value) ||
        !Number.isInteger(value) ||
        value < 1
    ) {
        return DEFAULT_LIMIT;
    }

    return Math.min(value, MAX_LIMIT);
}

function isContactCategory(
    value: unknown,
): value is ContactCategory {
    const category = asRecord(value);

    return (
        typeof category?.id === "string" &&
        category.id.trim().length > 0 &&
        typeof category.name === "string" &&
        category.name.trim().length > 0
    );
}

function isContactMessage(
    value: unknown,
): value is ContactMessage {
    const message = asRecord(value);

    return (
        typeof message?.id === "string" &&
        isContactCategory(message.category) &&
        typeof message.name === "string" &&
        typeof message.email === "string" &&
        (typeof message.phone === "string" ||
            message.phone === null) &&
        typeof message.subject === "string" &&
        typeof message.message === "string" &&
        (typeof message.handledAt === "string" ||
            message.handledAt === null) &&
        typeof message.createdAt === "string" &&
        typeof message.updatedAt === "string"
    );
}

function getFallbackAdminResponse(
    error: string,
    requiresAuth = false,
): GetAdminContactMessagesResponse {
    return {
        success: false,
        messages: [],
        total: 0,
        page: DEFAULT_PAGE,
        limit: DEFAULT_LIMIT,
        pageCount: 1,
        error,
        ...(requiresAuth ? { requiresAuth: true } : {}),
    };
}

export async function getContactCategories(): Promise<ContactCategoriesResponse> {
    try {
        const result = await apiFetch<{
            categories: ContactCategory[];
        }>("/contact/categories", {
            method: "GET",
        });

        if (!result.ok) {
            return {
                success: false,
                categories: [],
                error: getApiErrorMessage(
                    result,
                    "Failed to load contact categories.",
                ),
            };
        }

        const categories = result.data?.categories;

        if (
            !Array.isArray(categories) ||
            !categories.every(isContactCategory)
        ) {
            return {
                success: false,
                categories: [],
                error: "The server returned invalid contact categories.",
            };
        }

        return {
            success: true,
            categories,
        };
    } catch (error) {
        console.error(
            "Error in getContactCategories server action:",
            error,
        );

        return {
            success: false,
            categories: [],
            error: "An unexpected error occurred while fetching categories.",
        };
    }
}

export async function sendContactMessage(
    payload: SendContactMessagePayload,
): Promise<SendContactMessageResponse> {
    try {
        const name =
            typeof payload?.name === "string"
                ? payload.name.trim()
                : "";

        const email =
            typeof payload?.email === "string"
                ? payload.email.trim().toLowerCase()
                : "";

        const phone =
            typeof payload?.phone === "string"
                ? payload.phone.trim()
                : "";

        const categoryId =
            typeof payload?.categoryId === "string"
                ? payload.categoryId.trim()
                : "";

        const subject =
            typeof payload?.subject === "string"
                ? payload.subject.trim()
                : "";

        const message =
            typeof payload?.message === "string"
                ? payload.message.trim()
                : "";

        const fieldErrors: Record<string, string[]> = {};

        if (!name) {
            fieldErrors.name = ["Name is required."];
        } else if (
            name.length < 2 ||
            name.length > MAX_NAME_LENGTH
        ) {
            fieldErrors.name = [
                `Name must be between 2 and ${MAX_NAME_LENGTH} characters.`,
            ];
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            fieldErrors.email = ["Email is required."];
        } else if (
            email.length > MAX_EMAIL_LENGTH ||
            !emailPattern.test(email)
        ) {
            fieldErrors.email = [
                "Please enter a valid email address.",
            ];
        }

        if (phone && phone.length > MAX_PHONE_LENGTH) {
            fieldErrors.phone = [
                `Phone number cannot exceed ${MAX_PHONE_LENGTH} characters.`,
            ];
        }

        if (!categoryId) {
            fieldErrors.categoryId = [
                "Please select a category.",
            ];
        }

        if (!subject) {
            fieldErrors.subject = ["Subject is required."];
        } else if (subject.length > MAX_SUBJECT_LENGTH) {
            fieldErrors.subject = [
                `Subject cannot exceed ${MAX_SUBJECT_LENGTH} characters.`,
            ];
        }

        if (!message) {
            fieldErrors.message = ["Message is required."];
        } else if (
            message.length < MIN_MESSAGE_LENGTH ||
            message.length > MAX_MESSAGE_LENGTH
        ) {
            fieldErrors.message = [
                `Message must be between ${MIN_MESSAGE_LENGTH} and ${MAX_MESSAGE_LENGTH} characters.`,
            ];
        }

        if (Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                fieldErrors,
            };
        }

        const body: Record<string, unknown> = {
            name,
            email,
            categoryId,
            subject,
            message,
        };

        if (phone) {
            body.phone = phone;
        }

        const result = await apiFetch<{
            message: ContactMessage;
        }>("/contact/messages", {
            method: "POST",
            forward: await clientForwardHeaders(),
            body,
        });

        if (!result.ok) {
            if (result.status === 429) {
                return {
                    success: false,
                    rateLimited: true,
                    error:
                        getApiErrorMessage(
                            result,
                            "Too many requests. Please try again later.",
                        ),
                };
            }

            return {
                success: false,
                error: getApiErrorMessage(
                    result,
                    "Failed to send message.",
                ),
                fieldErrors: getFieldErrors(result),
            };
        }

        const submittedMessage = result.data?.message;

        if (!isContactMessage(submittedMessage)) {
            return {
                success: false,
                error:
                    "The server returned an invalid response. Please check your inbox before retrying.",
            };
        }


        try {
            revalidatePath("/dashboard", "layout");
            revalidatePath("/dashboard/contact-messages", "page");
        } catch (error) {
            console.error(
                "Contact message saved, but cache revalidation failed:",
                error,
            );
        }

        return {
            success: true,
            data: submittedMessage,
        };
    } catch (error) {
        console.error(
            "Error in sendContactMessage server action:",
            error,
        );

        return {
            success: false,
            error: "An unexpected error occurred while sending your message.",
        };
    }
}

export async function getAdminContactMessages(
    params: GetAdminContactMessagesParams = {},
): Promise<GetAdminContactMessagesResponse> {
    try {
        const token = await getAccessToken();

        if (!token?.trim()) {
            return getFallbackAdminResponse(
                "Please log in to access messages.",
                true,
            );
        }

        const currentPage = normalizePage(
            params?.page,
            DEFAULT_PAGE,
        );

        const limit = normalizeLimit(params?.limit);

        const queryParams = new URLSearchParams({
            page: String(currentPage),
            limit: String(limit),
        });

        const result = await apiFetch<{
            messages: ContactMessage[];
            total: number;
            page: number;
            limit: number;
            pageCount: number;
        }>(`/contact/messages?${queryParams.toString()}`, {
            method: "GET",
            token: token.trim(),
            forward: await clientForwardHeaders(),
        });

        if (!result.ok) {
            if (result.status === 401 || result.status === 403) {
                return getFallbackAdminResponse(
                    result.status === 401
                        ? "Your session has expired. Please log in again."
                        : "You are not authorized to view admin messages.",
                    true,
                );
            }

            return getFallbackAdminResponse(
                getApiErrorMessage(
                    result,
                    "Failed to load admin contact messages.",
                ),
            );
        }

        const data = result.data;

        if (
            !data ||
            !Array.isArray(data.messages) ||
            !data.messages.every(isContactMessage) ||
            !Number.isFinite(data.total) ||
            !Number.isInteger(data.total) ||
            data.total < 0 ||
            !Number.isFinite(data.page) ||
            !Number.isInteger(data.page) ||
            data.page < 1 ||
            !Number.isFinite(data.limit) ||
            !Number.isInteger(data.limit) ||
            data.limit < 1 ||
            !Number.isFinite(data.pageCount) ||
            !Number.isInteger(data.pageCount) ||
            data.pageCount < 1
        ) {
            return getFallbackAdminResponse(
                "The server returned invalid contact message data.",
            );
        }

        return {
            success: true,
            messages: data.messages,
            total: data.total,
            page: data.page,
            limit: data.limit,
            pageCount: data.pageCount,
        };
    } catch (error) {
        console.error(
            "Error in getAdminContactMessages server action:",
            error,
        );

        return getFallbackAdminResponse(
            "An unexpected error occurred while loading contact messages.",
        );
    }
}