"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import type { SessionPayload } from "@/lib/session-cookies";
import { clearSession, getRefreshToken, storeSession } from "@/lib/session";
import type { FormState } from "@/types";

/**
 * Signing in and out.
 *
 * These run on the Next.js server, which is what lets the tokens go into
 * httpOnly cookies: the browser posts a form here, this calls the API, and the
 * credentials never pass through code the browser can read.
 *
 * The returned FormState is for failures only. Success ends in a redirect, which
 * throws, so there is no success value to return.
 */

/**
 * Where to go after signing in. Home by default, since there is no
 * signed-in-only page to land on yet.
 *
 * Only local paths are honoured, so a crafted `next` cannot bounce somebody
 * off-site. It must start with a single slash: "//evil.example.com" is a
 * protocol-relative URL that browsers happily treat as another origin.
 */
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

  // Outside any try/catch on purpose. redirect() signals by throwing, and a
  // catch around it would swallow the navigation and leave the form spinning.
  redirect(safeRedirect(formData.get("next")));
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();

  // Revoke the row before dropping the cookie. The other order leaves a usable
  // refresh token in the database with nothing left to tell us which one it was.
  if (refreshToken) {
    await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } });
  }

  await clearSession();

  // Home, not /login. There are no signed-in-only pages yet, so somebody who
  // signs out is not being turned away from anything and has no reason to be
  // looking at a sign-in form.
  redirect("/");
}

/**
 * Not implemented. Deliberately left alone for now: resetting a password needs a
 * token table and an email sender, neither of which exists yet.
 *
 * It currently reports success without sending anything, which is a lie to the
 * person using it. The page should say so, or the route should come down, before
 * this ships anywhere real.
 */
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
