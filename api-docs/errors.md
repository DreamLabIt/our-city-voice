# Errors

One envelope for every failure, already modelled as `ApiError` in `lib/api.ts`.

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

`apiFetch` never throws for this. It returns `{ ok: false, status, error }`, so the
caller decides what the person sees.

## `details`

Present on validation failures only. Keyed by field name, with an array of
messages, which is the shape a form needs to put each message next to its own
input.

A failure that belongs to no single field is keyed `"_"`. Put those in the
form-level banner.

```jsonc
{ "details": { "name": ["Please enter your full name"] } }          // under the name input
{ "details": { "_": ["Send either mine or authorId, not both"] } }  // banner
{ "details": { "status.0": ["Invalid option: ..."] } }              // the first value of a repeated param
```

## Codes

| Status | `code` | Means |
| --- | --- | --- |
| `400` | `BAD_REQUEST` | the request is malformed or a value is invalid. Check `details` |
| `401` | `UNAUTHORIZED` | no token, expired token, or the account was deleted. Go to `/login` |
| `403` | `FORBIDDEN` | authenticated, but not allowed to ask for this |
| `404` | `NOT_FOUND` | no such resource |
| `409` | `CONFLICT` | it clashes with something that already exists |
| `429` | `TOO_MANY_REQUESTS` | rate limited. `message` names the wait, and a `Retry-After` header carries the seconds |
| `503` | `SERVICE_UNAVAILABLE` | a dependency is down. `apiFetch` also synthesises this with `code: "API_UNREACHABLE"` when the API cannot be reached at all |

A `500` never carries a useful message — an unexpected error's text can contain
table names and connection strings, so clients get a fixed string. `requestId` is
how you find the real one in the logs.

## Two deliberate choices

**`403`, not `404`, for a parameter you may not use.** The caller is
authenticated and this says the account is not allowed, which is the honest answer
and the one a client can act on.

**A wrong password is a `400` with a field, not a `401`.** See
[`PATCH /me`](endpoints/update-current-user.md). A `401` there would be
indistinguishable from an expired session, which sends a client off refreshing or
signs somebody out over a typo.

## Known wording wrinkle

> The `avatarUrl` message names only the host — "Uploads must be hosted on:
> res.cloudinary.com" — but the check also requires `https`. An
> `http://res.cloudinary.com/...` URL fails with that same host message.
> Cloudinary always returns `https`, so this should not come up in practice.
> Pre-existing behaviour, shared with registration.
