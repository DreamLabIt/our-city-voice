# `PATCH /me`

Changes your own details. Returns the full updated user, so a form can replace its
state from the response instead of guessing what the server did.

**Auth: required.** Rate limited — see [below](#rate-limit).

## Fields

| Field | Type | Rules |
| --- | --- | --- |
| `name` | `string` | trimmed, 2–120 characters |
| `email` | `string` | trimmed, lowercased, ≤254 characters, must be a valid address. **Requires `currentPassword` when it differs from the stored one** |
| `phone` | `string \| null` | trimmed, ≤32 characters. No format check — international numbers have no single shape |
| `avatarUrl` | `string \| null` | `https://` only, host must be `res.cloudinary.com`, ≤2048 characters |
| `currentPassword` | `string` | not a field being changed. Only read when `email` differs; ignored otherwise |

Send **at least one** of `name`, `email`, `phone`, `avatarUrl`. `currentPassword`
on its own is not a change and gets a `400`.

## Three rules worth reading before you write the form

### 1. Absent and `null` are different

Omitting a key leaves the column alone. Sending `null` clears it. A form that only
edits the name must not send `phone: null`, or it will wipe the number.

```jsonc
{ "name": "Ada" }                  // phone and avatar untouched
{ "name": "Ada", "phone": null }   // phone deleted
{ "phone": "" }                    // also deletes it — "" is stored as null
```

### 2. Unknown keys are a `400`, not ignored

The body is validated strictly.

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
`bio`, which have no columns. Drop them from the submitted body — keeping or
removing the inputs is a product decision.

### 3. Changing the email needs the password; resubmitting it does not

A settings form submits every field it renders, including the email it loaded. The
server compares against the stored address first and only asks for a password when
it genuinely differs, so a plain name change never prompts. The comparison is
case-insensitive, so `ADA@EXAMPLE.COM` matches a stored `ada@example.com` and
counts as unchanged.

Practically: let the person save without a password, and if you get back
`details.currentPassword`, reveal a password field and let them submit again. See
[guides/profile-form.md](../guides/profile-form.md).

A successful email change also sets `emailVerifiedAt` back to `null`, and does
**not** end any sessions — the tokens carry an id and a role, neither of which
changed, so the current access token keeps working and the person stays signed in.
They sign in with the new address from then on; the old one stops working
immediately.

## Response — `200`

`{ "user": { ... } }`, the same shape [`GET /me`](get-current-user.md) returns.

A `PATCH` whose values all match what is already stored returns `200` with the
unchanged user rather than an error. Nothing is wrong with saving a form you did
not edit.

## Status codes

| Status | Meaning | What to show |
| --- | --- | --- |
| `200` | updated | the saved values from the response |
| `400` | validation failed, or a wrong `currentPassword`. `details` is `field -> messages` | each message under its own input |
| `401` | no/expired token, or the account was deleted | redirect to `/login` |
| `409` | that email belongs to another account | a message on the email input |
| `429` | too many failed attempts from this IP | `error.message` names the wait; `Retry-After` carries the seconds |

### Real failure bodies

Copied from the test run. Envelope details in [errors.md](../errors.md).

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

A wrong `currentPassword` is a `400` with a field, **not** a `401`. The session is
perfectly valid, and a `401` here would be indistinguishable from an expired one —
which would send a client off refreshing, or sign somebody out over a typo.

## Rate limit

Twenty failed responses per IP per 15 minutes, in its own bucket — it cannot lock
out login, and `GET /me` is not counted. It exists because `currentPassword` makes
this the one authenticated endpoint where guessing has a prize, and because each
check runs scrypt, which is deliberately expensive.

**It counts validation failures too**, so a form that `PATCH`es on every keystroke,
or a retry loop on a `400`, will burn through it. Submit on submit, and stop on a
`4xx`.

The limiter is per process and in memory; see [not-implemented.md](../not-implemented.md).
