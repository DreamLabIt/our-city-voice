# Account API

Two endpoints for the signed-in person's own record: read it, and change it.

Everything below is live on `dev` and was tested against the running stack. The
frontend has not been wired up to any of it — that is what this document is for.

- [Before you start](#before-you-start)
- [The `User` object](#the-user-object)
- [`GET /api/v1/me`](#get-apiv1me)
- [`PATCH /api/v1/me`](#patch-apiv1me)
- [Errors](#errors)
- [Worked example](#worked-example)
- [Things this does not do](#things-this-does-not-do)

---

## Before you start

**The browser never calls these.** Only the Next.js server does, through
`lib/api.ts`, because the access token lives in an httpOnly cookie that client
JavaScript cannot read. A server component or a server action reads the cookie
and passes the token; see `lib/session.ts` for the existing pattern.

```ts
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

const token = await getAccessToken();
const result = await apiFetch<{ user: AuthUser }>("/me", { token });
```

`apiFetch` prefixes `INTERNAL_API_URL` (`http://backend:4000/api/v1` in docker),
so paths here are written without the `/api/v1`.

Both endpoints need `Authorization: Bearer <access token>`. Without one, or with
an expired one, they answer `401` with `{"error":{"code":"UNAUTHORIZED"}}`.
Refreshing is `proxy.ts`'s job and has already happened by the time a protected
page renders, so a `401` from here means the session is genuinely gone — send the
person to `/login`, do not retry.

### Relationship to `GET /auth/me`

`GET /auth/me` already exists and `lib/session.ts` uses it. `GET /me` returns a
**byte-identical body** (verified with `diff`). It exists so the thing you can
`PATCH` can also be `GET`-ed at the same path. Nothing needs migrating; use
whichever reads better at the call site, and keep `getCurrentUser()` as it is.

---

## The `User` object

Already declared as `AuthUser` in `frontend/types/index.ts`. **It has not
changed**, so no type edits are needed.

```ts
interface AuthUser {
  id: string;              // BigInt as a string. Never parse it into a number.
  name: string;
  email: string;
  phone: string | null;
  role: "user" | "super_admin";
  avatarUrl: string | null;
  departmentId: string | null;
  emailVerifiedAt: string | null;   // ISO 8601, or null. Always null today.
  createdAt: string;                // ISO 8601
}
```

A password hash cannot appear here: every query selects an explicit column list
that excludes it. There is no `updatedAt`, no `location` and no `bio` — see
[Things this does not do](#things-this-does-not-do).

---

## `GET /api/v1/me`

The signed-in account, read fresh from the database rather than decoded from the
token. The token only carries an id and a role, and those can be up to fifteen
minutes stale.

**`200 OK`**

```json
{
  "user": {
    "id": "5",
    "name": "Renamed Person",
    "email": "person@example.com",
    "phone": null,
    "role": "user",
    "avatarUrl": null,
    "departmentId": null,
    "emailVerifiedAt": null,
    "createdAt": "2026-10-07T09:18:25.401Z"
  }
}
```

| Status | When |
| --- | --- |
| `200` | always, when the token is valid |
| `401` | no token, malformed token, expired token, or the account has since been deleted |

---

## `PATCH /api/v1/me`

Changes your own details. Returns the full updated user, so a form can replace
its state from the response instead of guessing what the server did.

### Fields

| Field | Type | Rules |
| --- | --- | --- |
| `name` | `string` | trimmed, 2–120 characters |
| `email` | `string` | trimmed, lowercased, ≤254 characters, must be a valid address. **Requires `currentPassword` when it differs from the stored one** |
| `phone` | `string \| null` | trimmed, ≤32 characters. No format check — international numbers have no single shape |
| `avatarUrl` | `string \| null` | `https://` only, host must be `res.cloudinary.com`, ≤2048 characters |
| `currentPassword` | `string` | not a field being changed. Only read when `email` differs; ignored otherwise |

Send **at least one** of `name`, `email`, `phone`, `avatarUrl`.
`currentPassword` on its own is not a change and gets a `400`.

### Three rules worth reading before you write the form

**1. Absent and `null` are different.** Omitting a key leaves the column alone.
Sending `null` clears it. A form that only edits the name must not send
`phone: null`, or it will wipe the number.

```jsonc
{ "name": "Ada" }                  // phone and avatar untouched
{ "name": "Ada", "phone": null }   // phone deleted
{ "phone": "" }                    // also deletes it — "" is stored as null
```

**2. Unknown keys are a `400`, not ignored.** The body is validated strictly.

```jsonc
// 400 — Unrecognized keys: "bio", "location"
{ "name": "Ada", "bio": "hello", "location": "Dhaka" }
```

This is deliberate. The alternative is accepting a field, appearing to save it,
and dropping it on the floor — so somebody types a bio, sees a success toast and
loses it. `role` and `departmentId` are rejected the same way: neither is
self-service, and they are absent from the schema rather than stripped later, so
there is no code path where a request body reaches either column.

**The existing `ProfileForm.tsx` will hit this.** Its state holds `location` and
`bio`, which have no columns. Drop them from the submitted body (keeping or
removing the inputs is a product decision).

**3. Changing the email needs the password; resubmitting it does not.** A
settings form submits every field it renders, including the email it loaded. The
server compares against the stored address first and only asks for a password
when it genuinely differs, so a plain name change never prompts. The comparison
is case-insensitive, so `ADA@EXAMPLE.COM` matches a stored `ada@example.com` and
counts as unchanged.

Practically: let the person save without a password, and if you get back
`details.currentPassword`, reveal a password field and let them submit again.

A successful email change also sets `emailVerifiedAt` back to `null`, and does
**not** end any sessions — the tokens carry an id and a role, neither of which
changed, so the current access token keeps working and the person stays signed
in. They sign in with the new address from then on; the old one stops working
immediately.

### Responses

| Status | Meaning | What to show |
| --- | --- | --- |
| `200` | updated. Body is `{ "user": { ... } }` | the saved values from the response |
| `400` | validation failed, or a wrong `currentPassword`. `details` is `field -> messages` | each message under its own input |
| `401` | no/expired token, or the account was deleted | redirect to `/login` |
| `409` | that email belongs to another account | a message on the email input |
| `429` | too many failed attempts from this IP | `error.message` already names the wait; a `Retry-After` header carries the seconds |

A `PATCH` whose values all match what is already stored returns `200` with the
unchanged user rather than an error. Nothing is wrong with saving a form you did
not edit.

### Rate limit

Twenty failed responses per IP per 15 minutes, in its own bucket (it cannot lock
out login, and `GET /me` is not counted). It exists because `currentPassword`
makes this the one authenticated endpoint where guessing has a prize, and because
each check runs scrypt, which is deliberately expensive.

**It counts validation failures too**, so a form that `PATCH`es on every
keystroke, or a retry loop on a `400`, will burn through it. Submit on submit,
and stop on a `4xx`.

---

## Errors

One envelope for every failure, unchanged from the rest of the API and already
modelled as `ApiError` in `lib/api.ts`:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "Some fields need attention",
    "details": { "name": ["Please enter your full name"] },
    "requestId": "ad3cd143-8cb8-40ff-8fb6-35f6e62f47ae"
  }
}
```

`details` is present on validation failures only, keyed by field name, with an
array of messages. A failure that belongs to no single field is keyed `"_"` —
put those in the form-level banner.

Real responses, copied from the test run:

```jsonc
// {} or { "currentPassword": "x" }
{ "code": "BAD_REQUEST", "details": { "_": ["Send at least one of: name, email, phone, avatarUrl"] } }

// { "name": "A" }
{ "code": "BAD_REQUEST", "details": { "name": ["Please enter your full name"] } }

// { "avatarUrl": "https://evil.example.com/tracker.png" }
{ "code": "BAD_REQUEST", "details": { "avatarUrl": ["Uploads must be hosted on: res.cloudinary.com"] } }

// { "email": "new@example.com" }  — no password sent
{ "code": "BAD_REQUEST",
  "message": "Confirm your password to change your email address",
  "details": { "currentPassword": ["Enter your current password to change your email address"] } }

// { "email": "new@example.com", "currentPassword": "wrong" }
{ "code": "BAD_REQUEST", "details": { "currentPassword": ["That password is not correct"] } }

// { "email": "someone.else@example.com", "currentPassword": "right" }
{ "code": "CONFLICT", "message": "An account with that email address already exists" }
```

A wrong `currentPassword` is a `400` with a field, not a `401`. The session is
perfectly valid, and a `401` here would be indistinguishable from an expired one
— which would send a client off refreshing, or sign somebody out over a typo.

> The `avatarUrl` message names only the host, but the check also requires
> `https`. An `http://res.cloudinary.com/...` URL fails with that same host
> message. Cloudinary always returns `https`, so this should not come up in
> practice. Pre-existing behaviour, shared with registration.

---

## Worked example

A server action in the house style, mirroring `app/actions/register.ts`. Not
written to disk — the frontend is untouched.

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

Reading it in a server component needs no action at all — `getCurrentUser()` from
`lib/session.ts` already returns the same object.

### The password prompt

`fieldErrors.currentPassword` is the signal. Hide the password input until it
appears, then show it with that message next to it. Do not ask for a password up
front: most saves do not change the email and will never need one.

---

## Things this does not do

Called out so nothing here is mistaken for an oversight.

- **No password change.** `PATCH /me` will not set a new one. It needs its own
  endpoint: a new password has a minimum length that confirming an existing one
  must not be held to, and changing it should end every other session. Say the
  word and I will add `PATCH /me/password`.
- **No `location` or `bio`.** Neither column exists. Adding them is a migration,
  not an endpoint change.
- **No account deletion.** A user row is referenced by posts, comments and
  likes, so deleting one needs a decision about what happens to their reports.
- **No avatar cleanup.** Clearing `avatarUrl` forgets the URL; the image stays in
  Cloudinary. The `publicId` is never sent to or stored by the API, so nothing in
  our own data can delete it. This is the orphan problem from the upload work,
  and it is still open.
- **`emailVerifiedAt` is decoration.** Nothing sets it and nothing checks it. An
  email change clears it, which will matter when verification exists and is a
  no-op until then.
- **The rate limit is per process and in memory.** Two API containers each allow
  the full twenty, and a restart forgets everything. Fine for what it is;
  a real limit across replicas needs Redis, and there is no Redis in the stack.
