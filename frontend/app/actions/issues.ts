"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ReportIssueFormData, CreateIssueResult } from "@/types/issues";

const VALID_PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical",
] as const;

export async function createReportIssue(
    formData: ReportIssueFormData,
    authToken?: string
): Promise<CreateIssueResult> {
    if (!authToken?.trim()) {
        redirect("/login?callbackUrl=/report-issue");
    }
    try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
        if (!API_BASE_URL) {
            return {
                success: false,
                error: "API URL is not configured.",
            };
        }

        const title = formData.title?.trim() || "";
        const description = formData.description?.trim() || "";
        const categorySlug = formData.category?.trim() || "";
        const wardCode = formData.ward?.trim() || "";
        const cityName = formData.location?.city?.trim() || "";
        const address = formData.location?.address?.trim() || "";
        const street = formData.location?.street?.trim() || "";
        const postalCode = formData.location?.postalCode?.trim() || "";

        const priorityValue = (formData.priority || "medium")
            .trim()
            .toLowerCase();

        const fieldErrors: Record<string, string[]> = {};

        if (title.length < 6 || title.length > 160) {
            fieldErrors.title = [
                "Title must be between 6 and 160 characters.",
            ];
        }

        if (description.length < 15 || description.length > 5000) {
            fieldErrors.description = [
                "Description must be between 15 and 5000 characters.",
            ];
        }

        if (!categorySlug) {
            fieldErrors.category = ["Category is required."];
        }

        if (!wardCode) {
            fieldErrors.ward = ["Ward is required."];
        }

        if (
            !VALID_PRIORITIES.includes(
                priorityValue as (typeof VALID_PRIORITIES)[number]
            )
        ) {
            fieldErrors.priority = [
                "Priority must be low, medium, high, or critical.",
            ];
        }

        if (!cityName || cityName.length > 80) {
            fieldErrors["location.city"] = [
                "City is required and must not exceed 80 characters.",
            ];
        }

        if (!address || address.length > 240) {
            fieldErrors["location.address"] = [
                "Address is required and must not exceed 240 characters.",
            ];
        }

        if (street.length > 160) {
            fieldErrors["location.street"] = [
                "Street must not exceed 160 characters.",
            ];
        }

        if (postalCode.length > 16) {
            fieldErrors["location.postalCode"] = [
                "Postal code must not exceed 16 characters.",
            ];
        }

        if ((formData.media?.length || 0) > 6) {
            fieldErrors.media = ["You can upload a maximum of 6 media files."];
        }

        const lat = formData.location?.latitude;
        const lng = formData.location?.longitude;

        const hasLatitude = lat !== undefined && lat !== null;
        const hasLongitude = lng !== undefined && lng !== null;

        if (hasLatitude !== hasLongitude) {
            fieldErrors["location.latitude"] = [
                "Latitude and longitude must be provided together.",
            ];
        } else if (
            hasLatitude &&
            hasLongitude &&
            (!Number.isFinite(lat) || !Number.isFinite(lng))
        ) {
            fieldErrors["location.latitude"] = [
                "Latitude and longitude must be valid numbers.",
            ];
        }

        const formattedMedia = (formData.media || []).map((item, index) => {
            const url = item.url?.trim() || "";

            if (!url) {
                fieldErrors[`media.${index}.url`] = [
                    "Media URL is required.",
                ];
            }

            return {
                url,
                type: item.type,
                thumbnailUrl: item.thumbnailUrl || null,
                mimeType:
                    item.mimeType ||
                    (item.type === "image" ? "image/jpeg" : "video/mp4"),
                sizeBytes: item.sizeBytes ?? 0,
                durationSecs:
                    item.type === "video"
                        ? (item.durationSecs ?? null)
                        : null,
            };
        });

        if (Object.keys(fieldErrors).length > 0) {
            return {
                success: false,
                error: "Please check the report details and try again.",
                fieldErrors,
            };
        }

        const payload = {
            title,
            description,
            category: categorySlug,
            ward: wardCode,
            priority: priorityValue,
            isAnonymous: Boolean(formData.isAnonymous),
            location: {
                street: street || null,
                city: cityName,
                address,
                postalCode: postalCode || null,
                ...(hasLatitude && hasLongitude
                    ? {
                        latitude: lat,
                        longitude: lng,
                    }
                    : {}),
            },
            ...(formattedMedia.length > 0
                ? { media: formattedMedia }
                : {}),
        };

        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken.trim()}`,
            },
            body: JSON.stringify(payload),
            cache: "no-store",
        });

        let result: {
            post?: unknown;
            message?: string;
            details?: Record<string, string[] | string>;
        };

        try {
            result = await response.json();
        } catch {
            return {
                success: false,
                error: `The server returned an invalid response (HTTP ${response.status}).`,
            };
        }

        if (!response.ok) {
            const fallbackMessages: Record<number, string> = {
                400: "Invalid report details. Please check the form.",
                401: "Your session is invalid or expired. Please log in again.",
                503: "The report service is temporarily unavailable. Please try again.",
            };

            return {
                success: false,
                error:
                    result.message ||
                    fallbackMessages[response.status] ||
                    "Failed to submit report.",
                fieldErrors: result.details || {},
            };
        }

        if (!result.post) {
            return {
                success: false,
                error: "The report was submitted, but the server response did not contain the created report.",
            };
        }

        revalidatePath("/");
        revalidatePath("/issues");

        return {
            success: true,
            data: result.post,
        };
    } catch (err: unknown) {
        console.error("Error in createReportIssue server action:", err);

        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred while submitting the report.",
        };
    }
}