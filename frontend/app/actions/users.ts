"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type { AuthUser } from "@/types";
import type { ListUsersResult, UserDetailResult, UpdateRoleResult } from "@/types/user";

const MAX_LIMIT = 100;

function revalidateUserPages(): void {
    revalidatePath("/dashboard/users");
}

export async function getUsersList(
    page: number = 1,
    limit: number = 18,
    search?: string,
    role?: string,
): Promise<ListUsersResult> {
    const token = await getAccessToken();

    if (!token?.trim()) {
        return {
            success: false,
            error: "Please log in again.",
            requiresAuth: true,
        };
    }

    try {
        const params = new URLSearchParams();
        const safePage = Number.isInteger(page) && page >= 1 ? page : 1;
        const safeLimit = Number.isInteger(limit)
            ? Math.min(MAX_LIMIT, Math.max(1, limit))
            : 20;

        if (safePage > 1) params.set("page", String(safePage));
        if (safeLimit !== 20) params.set("limit", String(safeLimit));

        const trimmedSearch = search?.trim();
        if (trimmedSearch) params.set("search", trimmedSearch);

        const trimmedRole = role?.trim();
        if (trimmedRole === "user" || trimmedRole === "super_admin") {
            params.set("role", trimmedRole);
        }

        const queryString = params.toString();
        const endpoint = queryString ? `/users?${queryString}` : "/users";

        const res = await apiFetch<{
            users: AuthUser[];
            total: number;
            page: number;
            limit: number;
            pageCount: number;
        }>(endpoint, {
            method: "GET",
            token: token.trim(),
            forward: await clientForwardHeaders(),
        });

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
                    ? "Access denied. Super admin privileges required."
                    : res.error.message || "Failed to fetch users list.";

            return {
                success: false,
                error: message,
                fieldErrors: res.error.details as Record<string, string[]> | undefined,
            };
        }

        return {
            success: true,
            data: res.data,
        };
    } catch (err: unknown) {
        console.error("Error in getUsersList server action:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "An unexpected error occurred.",
        };
    }
}

export async function getUserDetails(id: string): Promise<UserDetailResult> {
    const token = await getAccessToken();

    if (!token?.trim()) {
        return {
            success: false,
            error: "Please log in again.",
            requiresAuth: true,
        };
    }

    const trimmedId = id?.trim();
    if (!trimmedId || !/^\d+$/.test(trimmedId)) {
        return {
            success: false,
            error: "Invalid user ID format. Must be digits.",
        };
    }

    try {
        const res = await apiFetch<{ user: AuthUser }>(
            `/users/${encodeURIComponent(trimmedId)}`,
            {
                method: "GET",
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
                    ? "Access denied. Super admin privileges required."
                    : res.error.status === 404
                        ? "User account not found."
                        : res.error.message || "Failed to fetch user details.";

            return {
                success: false,
                error: message,
            };
        }

        return {
            success: true,
            data: res.data.user,
        };
    } catch (err: unknown) {
        console.error("Error in getUserDetails server action:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "An unexpected error occurred.",
        };
    }
}

export async function updateUserRole(
    id: string,
    role: "user" | "super_admin",
): Promise<UpdateRoleResult> {
    const token = await getAccessToken();

    if (!token?.trim()) {
        return {
            success: false,
            error: "Please log in again.",
            requiresAuth: true,
        };
    }

    const trimmedId = id?.trim();
    if (!trimmedId || !/^\d+$/.test(trimmedId)) {
        return {
            success: false,
            error: "Invalid user ID format. Must be digits.",
        };
    }

    if (role !== "user" && role !== "super_admin") {
        return {
            success: false,
            error: "Invalid role specified. Must be 'user' or 'super_admin'.",
            fieldErrors: { role: ["Expected 'user' or 'super_admin'"] },
        };
    }

    try {
        const res = await apiFetch<{ user: AuthUser }>(
            `/users/${encodeURIComponent(trimmedId)}/role`,
            {
                method: "PATCH",
                token: token.trim(),
                forward: await clientForwardHeaders(),
                body: { role },
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
                    ? "Access denied. Super admin privileges required."
                    : res.error.status === 404
                        ? "User account not found."
                        : res.error.message || "Failed to update user role.";

            return {
                success: false,
                error: message,
                fieldErrors: res.error.details as Record<string, string[]> | undefined,
            };
        }

        revalidateUserPages();
        return {
            success: true,
            data: res.data.user,
        };
    } catch (err: unknown) {
        console.error("Error in updateUserRole server action:", err);
        return {
            success: false,
            error: err instanceof Error ? err.message : "An unexpected error occurred.",
        };
    }
}