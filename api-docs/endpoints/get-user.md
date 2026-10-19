# `GET /users/:id`

One registered account, by id, for a super admin's user detail panel.

**Auth: required, super admin only.** A signed-in non-admin gets a `403`; a
signed-out request gets a `401`.

## Request

`:id` is the account's `User.id` — the same string id the list returns. It must be
digits; anything else is a `400` before any query runs.

```ts
const result = await apiFetch<{ user: AuthUser }>(`/users/${id}`, { token });
```

## Response — `200`

```json
{
  "user": {
    "id": "312",
    "name": "Jane Rivera",
    "email": "jane@example.com",
    "phone": "+1 416 555 0134",
    "role": "user",
    "avatarUrl": null,
    "departmentId": null,
    "emailVerifiedAt": null,
    "createdAt": "2026-10-07T09:18:25.401Z"
  }
}
```

Full field reference: [`User`](../objects.md#user). This is the same body
[`GET /me`](get-current-user.md) returns; the only difference is *whose* row you
get.

## Status codes

| Status | When |
| --- | --- |
| `200` | the account exists |
| `400` | `:id` is not a string of digits (for example `/users/abc` or `/users/1.5`) |
| `401` | no/expired token |
| `403` | signed in, but not a super admin |
| `404` | no account with that id |

A well-formed id that matches nobody is a `404`, not a `200` with `null`: an
account that was never there and one that is gone look the same to the caller, and
both mean "stop showing this row".

## See also

- [`GET /users`](list-users.md) — the page this id came from
- [`PATCH /users/:id/role`](update-user-role.md) — change this account's role
