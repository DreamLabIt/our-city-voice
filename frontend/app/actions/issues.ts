"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import { type ReportIssueFormData, type CreateIssueResult, type UpdateReportInput, type MutationResult, VALID_PRIORITIES } from "@/types/issues";

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

function revalidateReportPages(): void {
    revalidatePath("/");
    revalidatePath("/reports");
    revalidatePath("/dashboard/issues");
    revalidatePath("/statistics");
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

        revalidateReportPages();

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

export async function updateReport(
    code: string,
    input: UpdateReportInput,
): Promise<MutationResult> {
    const token = await getAccessToken();

    if (!token?.trim()) {
        return {
            success: false,
            error: "Please log in again.",
            requiresAuth: true,
        };
    }

    if (Object.keys(input).length === 0) {
        return { success: false, error: "Nothing to update." };
    }

    const body: UpdateReportInput = { ...input };

    if (input.media) {
        if (input.media.length > 6) {
            return {
                success: false,
                error: "You can upload a maximum of 6 media files.",
                fieldErrors: { media: ["You can upload a maximum of 6 media files."] },
            };
        }

        const invalidIndex = input.media.findIndex((item) => !item.url?.trim());
        if (invalidIndex !== -1) {
            return {
                success: false,
                error: "Media URL is required.",
                fieldErrors: { [`media.${invalidIndex}.url`]: ["Media URL is required."] },
            };
        }

        body.media = input.media.map((item) => {
            const url = item.url.trim();

            return {
                url,
                type: item.type,
                thumbnailUrl: item.thumbnailUrl || null,
                mimeType: item.mimeType || guessMimeType(url, item.type),
                sizeBytes: Math.round(item.sizeBytes ?? 0),
                durationSecs:
                    item.type === "video" && item.durationSecs != null
                        ? Math.round(item.durationSecs)
                        : null,
            };
        });
    }

    try {
        const res = await apiFetch<{ post?: unknown }>(
            `/posts/${encodeURIComponent(code)}`,
            {
                method: "PATCH",
                token: token.trim(),
                forward: await clientForwardHeaders(),
                body,
            },
        );

        if (!res.ok) {
            if (res.error.status === 401) {
                return {
                    success: false,
                    error: "Your session has expired. Please log in again.",
                    requiresAuth: true,
                };
            }

            const message =
                res.error.status === 403
                    ? "You can only edit your own reports."
                    : res.error.status === 404
                        ? "This report no longer exists."
                        : res.error.message || "Failed to update report.";

            return {
                success: false,
                error: message,
                fieldErrors: res.error.details as
                    | Record<string, string[]>
                    | undefined,
            };
        }

        revalidateReportPages();
        return { success: true };
    } catch (err: unknown) {
        console.error("Error in updateReport server action:", err);
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred.",
        };
    }
}

export async function updateReportStatus(
    code: string,
    status: "pending" | "in_progress" | "resolved" | "rejected",
    note?: string,
): Promise<MutationResult & { post?: unknown }> {
    const token = await getAccessToken();

    if (!token?.trim()) {
        return {
            success: false,
            error: "Please log in again.",
            requiresAuth: true,
        };
    }

    const validStatuses = ["pending", "in_progress", "resolved", "rejected"];
    if (!validStatuses.includes(status)) {
        return {
            success: false,
            error: "Invalid status value provided.",
            fieldErrors: { status: ["Status must be pending, in_progress, resolved, or rejected."] },
        };
    }

    const trimmedNote = note?.trim();
    if (trimmedNote && trimmedNote.length > 1000) {
        return {
            success: false,
            error: "Note cannot exceed 1000 characters.",
            fieldErrors: { note: ["Note must be 1000 characters or less."] },
        };
    }

    const body: { status: string; note?: string | null } = {
        status,
        note: trimmedNote || null,
    };

    try {
        const res = await apiFetch<{ post?: unknown }>(
            `/posts/${encodeURIComponent(code)}/status`,
            {
                method: "PATCH",
                token: token.trim(),
                forward: await clientForwardHeaders(),
                body,
            },
        );

        if (!res.ok) {
            if (res.error.status === 401) {
                return {
                    success: false,
                    error: "Your session has expired. Please log in again.",
                    requiresAuth: true,
                };
            }

            const message =
                res.error.status === 403
                    ? "Only super admins can update report status."
                    : res.error.status === 404
                        ? "This report no longer exists."
                        : res.error.message || "Failed to update report status.";

            return {
                success: false,
                error: message,
                fieldErrors: res.error.details as Record<string, string[]> | undefined,
            };
        }

        revalidateReportPages();
        return { success: true, post: res.data.post };
    } catch (err: unknown) {
        console.error("Error in updateReportStatus server action:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "An unexpected error occurred.",
        };
    }
}

export async function deleteReport(code: string): Promise<MutationResult> {
    const token = await getAccessToken();

    if (!token?.trim()) {
        return {
            success: false,
            error: "Please log in again.",
            requiresAuth: true,
        };
    }

    try {
        const res = await apiFetch<unknown>(
            `/posts/${encodeURIComponent(code)}`,
            {
                method: "DELETE",
                token: token.trim(),
                forward: await clientForwardHeaders(),
            },
        );

        if (!res.ok) {
            if (res.error.status === 401) {
                return {
                    success: false,
                    error: "Your session has expired. Please log in again.",
                    requiresAuth: true,
                };
            }

            const message =
                res.error.status === 403
                    ? "You can only delete your own reports."
                    : res.error.status === 404
                        ? "This report no longer exists."
                        : res.error.message || "Failed to delete report.";

            return { success: false, error: message };
        }

        revalidateReportPages();
        return { success: true };
    } catch (err: unknown) {
        console.error("Error in deleteReport server action:", err);
        return {
            success: false,
            error:
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred.",
        };
    }
}