# `GET /contact/messages`

A page of contact-form submissions, newest first, for the super admin dashboard.

**Auth: required, super admin only.** A signed-in non-admin gets a `403`; a
signed-out request gets a `401`. Every message carries a sender's name, email and
phone, so it is not a public feed.

The check is the account's `role`, not a page guard: the same rule
[the super-admin user list](list-users.md) uses.

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `page` | `1` | positive integer |
| `limit` | `20` | positive integer, max `100` |

Blank values mean "no opinion", so `?page=&limit=` is a valid request for page 1.
There are **no filters yet** — no category, search or handled/unhandled parameter;
see [not-implemented.md](../not-implemented.md).

## Response — `200`

```json
{
  "messages": [
    {
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
  ],
  "total": 37,
  "page": 1,
  "limit": 20,
  "pageCount": 2
}
```

Same pagination envelope as the report feed: `total` is the count after filtering
(no filters today, so the whole table). A page past the end is not an error — it
returns an empty array with the real `total` and `pageCount`. Ordering is
`created_at DESC, id DESC`; the `id` tiebreak keeps page boundaries stable when two
messages share a timestamp.

Field reference: [`ContactMessage`](../objects.md#contactmessage).

### `handledAt` is always `null` today

The column exists and the field is returned so the dashboard can show a
New/Handled state, but **nothing can set it**: there is no mark-as-handled
endpoint. Treat every row as unhandled for now.

## Status codes

| Status | When |
| --- | --- |
| `200` | always, including an empty table (`total: 0`) and a page past the end |
| `400` | an invalid `page`/`limit` |
| `401` | no/expired token |
| `403` | signed in, but not a super admin |

## Cost

Two queries in one transaction: the page of rows and the `COUNT(*)` for `total`.
Constant regardless of `limit`.

## See also

- [`POST /contact/messages`](create-contact-message.md) — where rows come from
- [`GET /contact/categories`](list-contact-categories.md) — the category options
