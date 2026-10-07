# Wiring up the profile form

`app/dashboard/profile` with [`GET /me`](../endpoints/get-current-user.md) and
[`PATCH /me`](../endpoints/update-current-user.md).

**Reading needs no new code.** `getCurrentUser()` in `lib/session.ts` already
returns the same object the page needs.

## The server action

House style, mirroring `app/actions/register.ts`. Not written to disk — the
frontend is untouched.

```ts
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
  if (!token) return { error: "Your session has expired. Please sign in again." };

  const phone = String(formData.get("phone") ?? "").trim();
  const currentPassword = String(formData.get("currentPassword") ?? "");

  const result = await apiFetch<{ user: AuthUser }>("/me", {
    method: "PATCH",
    token,
    forward: await clientForwardHeaders(),
    body: {
      name: String(formData.get("name") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      // null, not "". Both clear the column, and null says so at the call site.
      phone: phone || null,
      // Omitted unless the person actually typed one. Sending "" is a 400,
      // and the API ignores it anyway when the email has not changed.
      ...(currentPassword ? { currentPassword } : {}),
    },
  });

  if (!result.ok) {
    return {
      error: result.error.message,
      ...(result.error.details ? { fieldErrors: result.error.details } : {}),
    };
  }

  // getCurrentUser is wrapped in React's cache(), so the navbar and the page
  // keep the old name until the route is rebuilt.
  revalidatePath("/dashboard/profile");

  return { success: true };
}
```

`FormState` in `types/index.ts` already has `fieldErrors: Record<string, string[]>`,
which is exactly the shape `details` arrives in, so each message lands under its
own input with no translation.

## The conditional password prompt

`fieldErrors.currentPassword` is the signal. Hide the password input until it
appears, then show it with that message next to it.

**Do not ask for a password up front.** Most saves do not change the email and will
never need one — the server compares against the stored address first. See
[rule 3 on the endpoint](../endpoints/update-current-user.md#3-changing-the-email-needs-the-password-resubmitting-it-does-not).

## Two fields to drop from the body

`ProfileForm.tsx` holds `location` and `bio` in state. Neither has a column, and
unknown keys are a `400`, so sending them fails the whole save. Remove them from
the submitted body; whether the inputs stay is a product decision.

## Do not `PATCH` on keystroke

The endpoint is rate limited and the limiter counts validation failures. Submit on
submit, and stop on a `4xx`.
