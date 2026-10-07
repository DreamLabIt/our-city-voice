# Conventions

Rules every endpoint follows. Worth reading once so the endpoint files can stay
short.

## How the frontend calls the API

**The browser never calls these directly.** Only the Next.js server does, through
`lib/api.ts`, because the access token lives in an httpOnly cookie that client
JavaScript cannot read. A server component or a server action reads the cookie and
passes the token; `lib/session.ts` is the existing pattern.

```ts
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

const token = await getAccessToken();
const result = await apiFetch<{ user: AuthUser }>("/me", { token });
```

`apiFetch` prefixes `INTERNAL_API_URL` (`http://backend:4000/api/v1` in docker),
so **every path in these docs is written without the `/api/v1`**.

A public endpoint can also be called straight from the browser using
`NEXT_PUBLIC_API_URL` — CORS already allows `http://localhost:3000`. But
`likedByMe` is always `false` that way and `mine` is unavailable, so it only suits
a signed-out view. One code path through the server is usually the better trade.

## Authentication

`Authorization: Bearer <access token>`. `apiFetch` adds it when you pass `token`
and omits it when you do not, so the same call works for both.

A `401` means the session is genuinely gone, not that it needs refreshing.
Refreshing is `proxy.ts`'s job and has already happened by the time a protected
page renders — so send the person to `/login` rather than retrying.

Three endpoints take the token as **optional**. They answer a signed-out request
and give a signed-in one more.

## Values

| Thing | Shape | Why |
| --- | --- | --- |
| ids | `string`, always | every id is a `BigInt`; past 2^53 a JSON number loses precision silently |
| timestamps | ISO 8601 `string` | formatting, including "2 hours ago", belongs where it is rendered |
| coordinates | `number \| null` | `DECIMAL(9,6)` fits exactly in a double, and `PostItem.latitude` already declares `number` |
| enums | the database's own values | see below |

### Enums are not display strings

`status` is `pending`, `in_progress`, `resolved`, `rejected`. `priority` is `low`,
`medium`, `high`, `critical`. `role` is `user` or `super_admin`.

Map them at the render boundary:

| API | Display |
| --- | --- |
| `pending` | Pending |
| `in_progress` | In Progress |
| `resolved` | Resolved |
| `rejected` | Rejected |

`priority` follows the same pattern. An API that shipped `"In Progress"` would
make itself the wrong place to change wording, and you would be stuck sending
`?status=In%20Progress` to filter.

### Filter by slug and code, never by display name

`?category=roads`, not `?category=Roads`. `?ward=ward-22`, not the ward's name.
Every report carries both, so you can show `category.name` and filter on
`category.slug` from the same row. Slugs survive a rename; display names do not.

## Query parameters

### A blank value means "no opinion", not an error

A query string built from form state is full of blanks: an untouched search box
submits `?search=`, a page counter that has not initialised submits `?page=`. All
of these are accepted and ignored, so you never have to assemble a URL
conditionally:

```
?page=&limit=&sort=&search=&category=&ward=&status=&priority=    → 200, unfiltered page 1
```

A value that is genuinely wrong still fails. `?page=abc`, `?limit=101`,
`?status=Pending` and `?category=Roads` are each a `400` naming the field.

### Multi-value filters accept three forms

```
?status=pending                      one value
?status=pending,in_progress          comma separated
?status=pending&status=resolved      repeated
```

Pick whichever is natural where you build the URL.

## Pagination

Offset-based everywhere: `page` and `limit` in, and this envelope back.

```json
{ "posts": [], "total": 27, "page": 1, "limit": 12, "pageCount": 3 }
```

`total` is the count **after** filtering, which is what a "Showing N of M" line
needs. A page past the end is not an error — it returns an empty array with the
real `total` and `pageCount`.

Offset rather than a cursor because the pages are numbered and a cursor cannot
give you a total cheaply. Every sort carries a unique tiebreak on `id`, which is
what keeps page boundaries stable: without one, rows with equal counts can
reorder between the query for page 1 and the query for page 2, so a row appears
twice or never.

The honest caveat: with `OFFSET`, a report filed while somebody is on page 2
shifts everything down one, so they may see a row again on page 3. A keyset cursor
fixes that and the index for it already exists (`posts(created_at DESC, id DESC)`).
It is the right change if the feed becomes infinite scroll rather than pages.
