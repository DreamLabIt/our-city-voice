"use server";

import { apiFetch, type ApiResult } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type { GetPublicStatsResponse, GetMyStatsResponse, GetActivityStatsResponse, GetAdminOverviewResponse, ReportStatistics, ActivitySummary, AdminOverview } from "@/types/statistics";

function asRecord(value: unknown): Record<string, unknown> | null {
    return value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;
}

function getApiErrorMessage(
    result: ApiResult<unknown>,
    fallback: string,
): string {
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


export async function getPublicStats(): Promise<GetPublicStatsResponse> {
    try {
        const result = await apiFetch<{ stats: ReportStatistics }>("/stats", {
            method: "GET",
        });

        if (!result.ok) {
            return {
                success: false,
                error: getApiErrorMessage(result, "Failed to load platform statistics."),
            };
        }

        if (!result.data?.stats) {
            return {
                success: false,
                error: "The server returned invalid statistics data.",
            };
        }

        return {
            success: true,
            stats: result.data.stats,
        };
    } catch (error) {
        console.error("Error in getPublicStats server action:", error);

        return {
            success: false,
            error: "An unexpected error occurred while loading statistics.",
        };
    }
}

export async function getMyStats(): Promise<GetMyStatsResponse> {
    try {
        const token = await getAccessToken();

        if (!token?.trim()) {
            return {
                success: false,
                requiresAuth: true,
                error: "Please log in to view your personal statistics.",
            };
        }

        const result = await apiFetch<{ stats: ReportStatistics }>("/stats/me", {
            method: "GET",
            token: token.trim(),
            forward: await clientForwardHeaders(),
        });

        if (!result.ok) {
            if (result.status === 401) {
                return {
                    success: false,
                    requiresAuth: true,
                    error: "Your session has expired. Please log in again.",
                };
            }

            return {
                success: false,
                error: getApiErrorMessage(result, "Failed to load your statistics."),
            };
        }

        if (!result.data?.stats) {
            return {
                success: false,
                error: "The server returned invalid statistics data.",
            };
        }

        return {
            success: true,
            stats: result.data.stats,
        };
    } catch (error) {
        console.error("Error in getMyStats server action:", error);

        return {
            success: false,
            error: "An unexpected error occurred while loading your statistics.",
        };
    }
}

export async function getActivityStats(): Promise<GetActivityStatsResponse> {
    try {
        const result = await apiFetch<{ activity: ActivitySummary }>("/stats/activity", {
            method: "GET",
        });

        if (!result.ok) {
            return {
                success: false,
                error: getApiErrorMessage(result, "Failed to load activity statistics."),
            };
        }

        if (!result.data?.activity) {
            return {
                success: false,
                error: "The server returned invalid activity data.",
            };
        }

        return {
            success: true,
            activity: result.data.activity,
        };
    } catch (error) {
        console.error("Error in getActivityStats server action:", error);

        return {
            success: false,
            error: "An unexpected error occurred while loading activity data.",
        };
    }
}

export async function getAdminOverview(): Promise<GetAdminOverviewResponse> {
    try {
        const token = await getAccessToken();

        if (!token?.trim()) {
            return {
                success: false,
                requiresAuth: true,
                error: "Please log in to view the admin overview.",
            };
        }

        const result = await apiFetch<AdminOverview>("/stats/admin", {
            method: "GET",
            token: token.trim(),
            forward: await clientForwardHeaders(),
        });

        if (!result.ok) {
            if (result.status === 401 || result.status === 403) {
                return {
                    success: false,
                    requiresAuth: true,
                    error:
                        result.status === 401
                            ? "Your session has expired. Please log in again."
                            : "You are not authorized to view admin overview statistics.",
                };
            }

            return {
                success: false,
                error: getApiErrorMessage(result, "Failed to load admin overview statistics."),
            };
        }

        if (!result.data?.stats || !result.data?.activity) {
            return {
                success: false,
                error: "The server returned invalid admin overview data.",
            };
        }

        return {
            success: true,
            data: result.data,
        };
    } catch (error) {
        console.error("Error in getAdminOverview server action:", error);

        return {
            success: false,
            error: "An unexpected error occurred while loading admin overview.",
        };
    }
}