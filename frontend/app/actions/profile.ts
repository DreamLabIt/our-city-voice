"use server";

import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import { getAccessToken } from "@/lib/session";
import type { AuthUser, FormState } from "@/types";

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
    const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();
    const currentPassword = String(
        formData.get("currentPassword") ?? "",
    );

    const payload: Record<string, unknown> = {
        name,
        email,
        phone: phone || null,
        ...(avatarUrl ? { avatarUrl } : {}),
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
}