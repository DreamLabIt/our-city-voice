# `POST /contact/messages`

Stores a message sent from the public contact form.

**Auth: none.** The form is open to signed-out visitors: `contact_messages` has no
`user_id`, which is exactly why this endpoint is rate limited.

## Rate limit

Submissions are capped per IP — `CONTACT_RATE_LIMIT_MAX` (default **5**) per
`CONTACT_RATE_LIMIT_WINDOW_MS` (default **1 hour**). Unlike the sign-in limit,
**successful submissions count too**, because the thing being prevented is spam,
not brute force.

The limit is per process and in memory: replicas each allow the full quota, and a
restart forgets it. See [not-implemented.md](../not-implemented.md).

## Request body

JSON, validated strictly — an unknown key is a `400`, not silent.

```jsonc
{
  "name": "Jane Rivera",                                 // required, 2–120 chars
  "email": "jane@example.com",                           // required, valid address, ≤254 chars
  "phone": "+1 416 555 0134",                            // optional; null/omitted/blank → null, ≤32 chars
  "categoryId": "2",                                      // required, an id from GET /contact/categories
  "subject": "Broken street light on my block",           // required, 1–160 chars
  "message": "The light at the corner has been out for…"  // required, 10–5000 chars
}
```

Every string is trimmed first, so a body of only spaces fails as if it were empty.
`email` is lowercased before it is stored.

### `categoryId`, not the display label

Send the `id` of an option from
[`GET /contact/categories`](list-contact-categories.md). A `categoryId` that does
not exist is a `400` under `categoryId` — there is no "filed nowhere" fallback.
This replaces the form's hardcoded labels, which do not match the stored
categories; see that endpoint's table for the mapping.

## Response — `201`

```json
{
  "message": {
    "id": "12",
    "category": { "id": "2", "name": "Report a Problem" },
    "name": "Jane Rivera",
    "email": "jane@example.com",
    "phone": "+1 416 555 0134",
    "subject": "Broken street light on my block",
    "message": "The light at the corner has been out for…",
    "handledAt": null,
    "createdAt": "2026-10-14T09:12:04.512Z",
    "updatedAt": "2026-10-14T09:12:04.512Z"
  }
}
```

The created [`ContactMessage`](../objects.md#contactmessage). The form needs
nothing from it beyond the success signal, but the whole row comes back for
symmetry with the other writes.

## What the server sets

`createdAt`/`updatedAt` are the insert time, and `handledAt` starts `null`. None of
these is accepted from the client. There is no `userId`: the endpoint never sees an
account.

## Status codes

| Status | When |
| --- | --- |
| `201` | stored |
| `400` | validation failed, an unknown key, or an unknown `categoryId`. `details` is field → messages |
| `429` | over the rate limit. `Retry-After` carries the seconds |

`details` lands each message under the field it belongs to, so `details.email` goes
next to the email input — envelope in [errors.md](../errors.md).

## See also

- [`GET /contact/categories`](list-contact-categories.md) — where `categoryId` comes from
- [`GET /contact/messages`](list-contact-messages.md) — the admin inbox that reads these back
