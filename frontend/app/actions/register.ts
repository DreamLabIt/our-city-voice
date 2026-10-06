"use server";

import { redirect } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { clientForwardHeaders } from "@/lib/client-headers";
import type { SessionPayload } from "@/lib/session-cookies";
import { storeSession } from "@/lib/session";
import type { RegisterFormState } from "@/types";

/**
 * Creating an account.
 *
 * The avatar arrives as a URL, not a file. The browser sends it to Cloudinary
 * itself, as the first step of submitting this form, and passes on the URL it got
 * back: see hooks/use-uploads.ts. That keeps image bytes out of the server action
 * body, which has a 1MB default limit and would otherwise need raising for every
 * action in the app.
 *
 * Registering signs you in. The API answers with the same session payload login
 * does, so this ends on the home page with the navbar already showing an avatar,
 * rather than on a sign-in form asking for what was just typed.
 */
export async function registerAction(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const avatarUrl = String(formData.get("avatarUrl") ?? "").trim();

  if (!name || !email || !password) {
    return { error: "All required fields must be filled out." };
  }

  const result = await apiFetch<SessionPayload>("/auth/register", {
    method: "POST",
    forward: await clientForwardHeaders(),
    body: {
      name,
      email,
      password,
      // Omitted rather than sent empty: the API rejects "" as an invalid URL,
      // and an absent avatar is the normal case.
      ...(avatarUrl ? { avatarUrl } : {}),
    },
  });

  if (!result.ok) {
    return {
      error: result.error.message,
      ...(result.error.details ? { fieldErrors: result.error.details } : {}),
    };
  }

  await storeSession(result.data);

  redirect("/");
}
