# `GET /users`

A page of every registered account, newest first, for the super admin's user
management screen.

**Auth: required, super admin only.** A signed-in non-admin gets a `403`; a
signed-out request gets a `401`. Every row carries an email and a role, so it is
not a public list.

The check is the account's `role`, not a page guard: the same rule the contact
inbox uses.

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `page` | `1` | positive integer |
| `limit` | `20` | positive integer, max `100` |
| `search` | — | 1–120 characters, matched against **name and email** |
| `role` | — | `user` or `super_admin` |

`search` and `role` are optional; omitting them lists everyone.

### Blank parameters are a `400` here

Unlike the report feed, this endpoint does **not** treat a blank value as "no
opinion". Each parameter is validated as-is, so `?page=`, `?limit=`, `?search=`
and `?role=` all come back as a `400` (see [below](#real-failure-bodies)).

Build the query string by adding the keys you mean to send, rather than leaving
empty ones in place:

```ts
const params = new URLSearchParams();
if (page > 1) params.set("page", String(page));
if (search) params.set("search", search);
const result = await apiFetch<ListUsersResult>(`/users?${params}`, { token });
```

## Response — `200`

```json
{
  "users": [
    {
      "id": "312",
      "name": "Jane Rivera",
      "email": "jane@example.com",
      "phone": "+1 416 555 0134",
      "role": "user",
      "avatarUrl": "https://res.cloudinary.com/...",
      "departmentId": null,
      "emailVerifiedAt": null,
      "createdAt": "2026-10-02T08:11:00.000Z"
    }
  ],
  "total": 312,
  "page": 1,
  "limit": 20,
  "pageCount": 16
}
```

Same pagination envelope as the report feed: `total` is the count after filtering.
A page past the end is not an error — it returns an empty array with the real
`total` and `pageCount`. Ordering is `created_at DESC, id DESC`; the `id` tiebreak
keeps page boundaries stable when two accounts register in the same second.

Field reference: [`User`](../objects.md#user). It is the same shape
[`GET /me`](get-current-user.md) returns, so a row here can reuse the frontend's
`AuthUser` type as-is.

### `role` is the whole filter for now

There is no filter for `emailVerifiedAt`, `departmentId`, or a registration date
range; see [not-implemented.md](../not-implemented.md).

## Status codes

| Status | When |
| --- | --- |
| `200` | always, including an empty table (`total: 0`) and a page past the end |
| `400` | an invalid or blank `page`, `limit`, `search` or `role` |
| `401` | no/expired token |
| `403` | signed in, but not a super admin |

### Real failure bodies

```jsonc
// ?role=admin
{ "error": { "code": "BAD_REQUEST", "message": "Some fields need attention",
             "details": { "role": ["Invalid option: expected one of \"user\"|\"super_admin\""] } } }

// ?search=   (blank)
{ "error": { "code": "BAD_REQUEST", "message": "Some fields need attention",
             "details": { "search": ["Too small: expected string to have >=1 characters"] } } }
```

Envelope details in [errors.md](../errors.md).

## Cost

Two queries in one transaction: the page of rows and the `COUNT(*)` for `total`.
A case-insensitive `contains` for `search` is a sequential scan; see
[not-implemented.md](../not-implemented.md).

## See also

- [`GET /users/:id`](get-user.md) — one account
- [`PATCH /users/:id/role`](update-user-role.md) — promote or demote one
- [`GET /contact/messages`](list-contact-messages.md) — the other super-admin list
