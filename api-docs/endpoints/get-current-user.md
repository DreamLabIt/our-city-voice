# `GET /me`

The signed-in account, read fresh from the database rather than decoded from the
token. The token only carries an id and a role, and those can be up to fifteen
minutes stale.

**Auth: required.**

## Request

No parameters, no body.

```ts
const result = await apiFetch<{ user: AuthUser }>("/me", { token });
```

## Response — `200`

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

Full field reference: [`User`](../objects.md#user).

## Status codes

| Status | When |
| --- | --- |
| `200` | always, when the token is valid |
| `401` | no token, malformed token, expired token, or the account has since been deleted |

## Relationship to `GET /auth/me`

`GET /auth/me` already exists and `lib/session.ts` uses it. This returns a
**byte-identical body** — verified with `diff`. It exists so that the thing you can
`PATCH` can also be `GET`-ed at the same path.

Nothing needs migrating. `getCurrentUser()` in `lib/session.ts` can stay exactly
as it is; use whichever path reads better at a new call site.

## See also

- [`PATCH /me`](update-current-user.md) — change these fields
- [guides/profile-form.md](../guides/profile-form.md)
