"use server";

import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken, getCurrentUser } from "@/lib/session";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import type { AuthUser, FormState } from "@/types";

function extractPublicIdFromUrl(url: string): string | null {
    try {
        const parts = url.split("/upload/");
        if (parts.length < 2) return null;
        const pathWithoutVersion = parts[1].replace(/^v\d+\//, "");
        const lastDotIndex = pathWithoutVersion.lastIndexOf(".");
        return lastDotIndex === -1 ? pathWithoutVersion : pathWithoutVersion.substring(0, lastDotIndex);
    } catch {
        return null;
    }
}

export async function updateProfileAction(
    _prevState: FormState,
    formData: FormData,
): Promise<FormState> {
    const token = await getAccessToken();

    if (!token) {
        return {
            error: "Your session has expired. Please sign in again.",
        };
    }

    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    const newAvatarUrl = String(formData.get("avatarUrl") ?? "").trim();
    const currentPassword = String(
        formData.get("currentPassword") ?? "",
    );

    try {
        const currentUser = await getCurrentUser();
        const oldAvatarUrl = currentUser?.avatarUrl;

        if (newAvatarUrl && oldAvatarUrl && newAvatarUrl !== oldAvatarUrl) {
            const publicId = extractPublicIdFromUrl(oldAvatarUrl);
            if (publicId) {
                await deleteCloudinaryAsset(publicId);
            }
        }

        const payload: Record<string, unknown> = {
            name,
            email,
            phone: phone || null,
            ...(newAvatarUrl ? { avatarUrl: newAvatarUrl } : {}),
            ...(currentPassword ? { currentPassword } : {}),
        };

        const result = await apiFetch<{ user: AuthUser }>("/me", {
            method: "PATCH",
            token,
            forward: await clientForwardHeaders(),
            body: payload,
        });

        if (!result.ok) {
            return {
                error: result.error.message,
                ...(result.error.details
                    ? {
                        fieldErrors: result.error.details,
                    }
                    : {}),
            };
        }

        revalidatePath("/dashboard/profile");

        return {
            success: true,
        };
    } catch (err: unknown) {
        console.error("Error in updateProfileAction:", err);
        return {
            error: err instanceof Error ? err.message : "Failed to update profile.",
        };
    }
}