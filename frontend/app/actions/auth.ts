"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import type { SessionPayload } from "@/lib/session-cookies";
import { clearSession, getRefreshToken, storeSession } from "@/lib/session";
import type { FormState } from "@/types";

function safeRedirect(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") return "/";
  return /^\/(?!\/)/.test(value) ? value : "/";
}

export async function loginAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const result = await apiFetch<SessionPayload>("/auth/login", {
    method: "POST",
    body: { email, password },
    forward: await clientForwardHeaders(),
  });

  if (!result.ok) {
    return {
      error: result.error.message,
      ...(result.error.details ? { fieldErrors: result.error.details } : {}),
    };
  }

  await storeSession(result.data);

  redirect(safeRedirect(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });
  }

  await clearSession();

  redirect("/login");
}

export async function forgotPasswordAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  return { success: true };
}
