"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type { ReportIssueFormData, CreateIssueResult } from "@/types/issues";

const VALID_PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical",
] as const;

const MIME_BY_EXT: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
};

function guessMimeType(url: string, type: string): string {
    const ext = url.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
    return MIME_BY_EXT[ext] ?? (type === "image" ? "image/jpeg" : "video/mp4");
}

export async function createReportIssue(
    formData: ReportIssueFormData,
): Promise<CreateIssueResult> {
    const authToken = await getAccessToken();
    if (!authToken?.trim()) {
        return {
            success: false,
            error: "You must be logged in to report an issue.",
            requiresAuth: true,
        };
    }

    try {
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
                mimeType: item.mimeType || guessMimeType(url, item.type),
                sizeBytes: item.sizeBytes ?? 0,
                durationSecs:
                    item.type === "video" && item.durationSecs != null
                        ? Math.round(item.durationSecs)
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

        console.log("Payload Data", payload)

        const result = await apiFetch<{ post?: unknown }>("/posts", {
            method: "POST",
            token: authToken.trim(),
            forward: await clientForwardHeaders(),
            body: payload,
        });

        if (!result.ok) {
            if (result.error.status === 401) {
                return {
                    success: false,
                    error: "Your session is invalid or expired. Please log in again.",
                    requiresAuth: true,
                };
            }

            return {
                success: false,
                error: result.error.message || "Failed to submit report.",
                fieldErrors: result.error.details ?? {},
            };
        }

        if (!result.data.post) {
            return {
                success: false,
                error: "The report was submitted, but the server response did not contain the created report.",
            };
        }

        revalidatePath("/");
        revalidatePath("/reports");

        return {
            success: true,
            data: result.data.post,
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