# `PATCH /users/:id/role`

Changes an account's role — promote a citizen to super admin, or demote one back.
Returns the updated [`User`](../objects.md#user), so the table row can be replaced
from the response rather than guessed.

**Auth: required, super admin only.** A signed-in non-admin gets a `403`; a
signed-out request gets a `401`.

## Request

```ts
const result = await apiFetch<{ user: AuthUser }>(`/users/${id}/role`, {
  method: "PATCH",
  token,
  body: { role: "super_admin" },
});
```

| Field | Type | Rules |
| --- | --- | --- |
| `role` | `string` | required, exactly `user` or `super_admin` |

Only `role` is read. Omit it and the request is a `400`; send an unknown value and
it is a `400` with the message on the `role` field. `:id` is the target's
`User.id` and must be digits — a malformed id (`/users/abc`) is a `400` before any
lookup.

## Three things it refuses, on purpose

### 1. You cannot change your own role

A super admin demoting themselves would lock the last admin door with nothing in
the app able to reopen it. Do it from another admin account, or with the
`admin:create` script.

```jsonc
// 400
{ "error": { "code": "BAD_REQUEST",
             "message": "You cannot change your own role. Ask another super admin, or use the admin:create script." } }
```

Note there is no `details` map here — the failure belongs to no single field, so
show `error.message` in a banner.

### 2. The last super admin cannot be demoted

Demoting the only remaining super admin would leave nobody who can use the admin
API. The server counts the other super admins first; if there are none, it refuses.

```jsonc
// 400
{ "error": { "code": "BAD_REQUEST",
             "message": "This is the only super admin. Promote somebody else before demoting this account." } }
```

### 3. A change ends that account's sessions

Changing a role revokes **every active refresh token the target holds**. It has to:
an access token carries the role in its claims and is not re-checked against the
database, so without this a demoted admin would keep admin access until their
current token expired.

The practical consequence is the reverse for a promotion: **a promoted user must
sign in again** to receive a token that says `super_admin`. Their existing session
keeps working, but as a `user`, until they do.

## Idempotent when nothing changes

Setting a role to what it already is returns `200` with the unchanged user and
revokes nothing. Re-sending a row's current role is a no-op, not an error.

## Response — `200`

`{ "user": { ... } }`, the target's row after the change — the same shape the list
returns.

## Status codes

| Status | When |
| --- | --- |
| `200` | changed, or already had that role |
| `400` | `:id` is not digits, or `role` is missing/invalid, or changing your own role, or demoting the last super admin |
| `401` | no/expired token |
| `403` | signed in, but not a super admin |
| `404` | no account with that id |

## Cost

A read, an optional count, an update and a `refresh_tokens` update — all by primary
key.

## See also

- [`GET /users`](list-users.md) — find the account and its id
- [`GET /users/:id`](get-user.md) — confirm the row before changing it
- [not-implemented.md](../not-implemented.md) — no way to create or delete a user from the API
