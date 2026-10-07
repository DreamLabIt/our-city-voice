# OurCityVoice API

Endpoints the frontend can build against. Everything here is live on `dev` and
was tested against the running stack; the frontend has not been wired up to any
of it, which is what this document is for.

**Account** — the signed-in person's own record
- [Before you start](#before-you-start)
- [The `User` object](#the-user-object)
- [`GET /api/v1/me`](#get-apiv1me)
- [`PATCH /api/v1/me`](#patch-apiv1me)

**Reports** — the public feed, one report, and both dashboards
- [`GET /api/v1/posts`](#get-apiv1posts)
- [`GET /api/v1/posts/filters`](#get-apiv1postsfilters)
- [`GET /api/v1/posts/:code`](#get-apiv1postscode)
- [`GET /api/v1/posts/:code/comments`](#get-apiv1postscodecomments)
- [Wiring up the reports page](#wiring-up-the-reports-page)
- [Wiring up the detail page](#wiring-up-the-detail-page)

**Shared**
- [Errors](#errors)
- [Worked examples](#worked-examples)
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

# Account

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

# Reports

## `GET /api/v1/posts`

Every report in the database, filtered and paginated. One endpoint serves the
public reports page, the citizen dashboard and the admin dashboard, because they
are the same query with different filters — only *which rows a caller may ask
for* differs, and that is enforced per parameter below.

**Public.** A signed-out request works and returns the feed. A token is optional
and adds two things: `likedByMe` is filled in, and `mine=true` becomes available.

### Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `page` | `1` | positive integer |
| `limit` | `12` | positive integer, max `100` |
| `sort` | `newest` | `newest`, `oldest`, `most_liked`, `most_commented`, `most_viewed`, `recently_updated` |
| `search` | — | free text, ≤120 chars. Matches title, description, tracking code, address or city, case-insensitively |
| `category` | — | one or more category **slugs** (`roads`) |
| `ward` | — | one or more ward **codes** (`ward-22`) |
| `status` | — | one or more of `pending`, `in_progress`, `resolved`, `rejected` |
| `priority` | — | one or more of `low`, `medium`, `high`, `critical` |
| `mine` | `false` | `true`/`false`. Only your own reports. **401 if signed out** |
| `authorId` | — | a user id. **Super admin only, 403 otherwise** |
| `includeDeleted` | `false` | `true`/`false`. Includes moderated-away reports. **Super admin only, 403 otherwise** |

`mine` and `authorId` both narrow to one author, so sending both is a `400`
rather than one silently winning.

### Two conveniences you can rely on

**Multi-value filters accept three forms**, so you can build the URL whichever
way is natural:

```
?status=pending                      one value
?status=pending,in_progress          comma separated
?status=pending&status=resolved      repeated
```

**A blank value means "no filter", not an error.** An untouched search box
submits `?search=`, and a page counter that has not initialised submits `?page=`.
Both are accepted and ignored, so you never have to assemble the query string
conditionally:

```
?page=&limit=&sort=&search=&category=&ward=&status=&priority=    → 200, unfiltered page 1
```

A value that is genuinely wrong still fails: `?page=abc`, `?limit=101`,
`?status=Pending` and `?category=Roads` are all `400` with a field in `details`.

### Response

```json
{
  "posts": [ /* ... */ ],
  "total": 27,
  "page": 1,
  "limit": 12,
  "pageCount": 3
}
```

`total` is the count **after** filtering, which is what the "Showing N of M" line
on the reports page needs. A page past the end is not an error — it returns an
empty `posts` array with the real `total` and `pageCount`.

### One post

```json
{
  "id": "28",
  "trackingCode": "OCV-2026-VID001",
  "title": "Sinkhole opening up at the intersection",
  "description": "Video shows the edge collapsing.",
  "status": "pending",
  "priority": "critical",
  "isAnonymous": false,
  "category": { "id": "1", "name": "Roads", "slug": "roads", "icon": "Road" },
  "ward":     { "id": "1", "name": "Ward 10 (Spadina Fort York)", "code": "ward-10" },
  "department": { "id": "2", "name": "Transportation Services" },
  "author":     { "id": "2", "name": "Platform User", "avatarUrl": "https://res.cloudinary.com/..." },
  "assignedOfficer": null,
  "location": {
    "street": null,
    "city": "Toronto",
    "address": "400 Front St W",
    "postalCode": "M5V 3K2",
    "latitude": 43.812345,
    "longitude": -79.287654
  },
  "counts": { "views": 51, "likes": 1, "comments": 0 },
  "likedByMe": false,
  "media": {
    "image": "/road_surface.jpeg",
    "video": "https://lorem.video/...",
    "durationSecs": 47,
    "count": 3
  },
  "resolvedAt": null,
  "createdAt": "2026-10-07T10:13:40.253Z",
  "updatedAt": "2026-10-07T10:13:40.253Z"
}
```

`department`, `author`, `assignedOfficer`, `street`, `postalCode`, `latitude`,
`longitude`, `media.image`, `media.video`, `media.durationSecs` and `resolvedAt`
are all nullable. `latitude` and `longitude` are **numbers**, not the strings a
`DECIMAL` column usually serialises to — `DECIMAL(9,6)` fits exactly in a double,
and `PostItem.latitude` already declares `number | null`.

### Four things about this shape

**1. `status` and `priority` are the database's values, not display strings.**
Same as `role` on the user object. Map them at the render boundary:

| API | Display |
| --- | --- |
| `pending` | Pending |
| `in_progress` | In Progress |
| `resolved` | Resolved |
| `rejected` | Rejected |

`priority` is `low`/`medium`/`high`/`critical` → Low/Medium/High/Critical. An API
that ships display strings makes itself the wrong place to change wording, and
you would be stuck sending `?status=In%20Progress` to filter.

**2. Filter by slug and code, not by name.** `?category=roads`, not
`?category=Roads`. Each post carries both, so you can show `category.name` and
filter on `category.slug` from the same row. Slugs survive a rename; display
names do not.

**3. An anonymous report has no author.** When `isAnonymous` is `true`, `author`
is `null` — for everyone, super admins included. The name is never put in the
response, so a component that forgets to check `isAnonymous` still cannot leak
it. There is deliberately no admin override here; see
[Things this does not do](#things-this-does-not-do).

**4. `media` is enough for a card, not the gallery.** `image` is the first image
by sort order, falling back to a video's poster frame so a video-only report
still has a thumbnail. `count` is every attachment, so a card can show "+2".
The full gallery belongs to a detail endpoint that does not exist yet.

> `media.image` and `media.video` come from `media.storage_key`, which holds a
> bucket key. The URL is built at read time: an absolute URL and a root-relative
> path (`/road_surface.jpeg`, which is what fixtures use) pass through untouched,
> and anything else gets `MEDIA_BASE_URL` in front of it. That variable is empty
> in development, so a bare bucket key comes back unprefixed and unusable — set
> it once real uploads start storing keys.

### Pagination is offset-based

`page`/`limit`, matching `GET /api/v1/users`, because the reports page needs a
total and a page count and a cursor cannot give you those cheaply.

Every sort has a unique tiebreak on `id`, which is what makes page boundaries
stable — without it, rows with equal like counts can reorder between the query
for page 1 and the query for page 2, and a report shows up twice or never. I
verified this by walking every page of every sort at several page sizes and
checking each row appeared exactly once.

The honest caveat: with `OFFSET`, a report filed while somebody is on page 2
shifts everything down by one, so they may see one row again on page 3. A keyset
cursor fixes that and the index for it already exists
(`posts(created_at DESC, id DESC)`); it is the right change if this becomes an
infinite scroll rather than numbered pages.

### Costs

Constant number of SQL statements per request regardless of `limit` — measured,
not assumed: 10 statements signed out, 11 signed in (the extra one looks up every
like for the page in a single batched query, not one per row). No N+1.

`search` is a case-insensitive `contains`, which is a sequential scan. Fine at
this size, and it wants a trigram index (`pg_trgm`) or a `tsvector` column before
the table gets large.

---

## `GET /api/v1/posts/filters`

The option lists for the filter dropdowns. Public, no parameters.

This has to be its own call rather than a block on the list response. The options
are a property of the whole table, and a paginated list only knows about the
rows it returned — build the dropdown from those and "Roads" vanishes from the
menu the moment you are on a page with no road reports.

```json
{
  "categories": [
    { "id": "1", "name": "Roads", "value": "roads", "icon": "Road", "postCount": 9 },
    { "id": "5", "name": "Parks", "value": "parks", "icon": "Trees", "postCount": 0 }
  ],
  "wards": [
    { "id": "2", "name": "Ward 22 (Scarborough Agincourt)", "value": "ward-22", "postCount": 8 }
  ],
  "statuses":   [ { "value": "pending", "postCount": 9 } ],
  "priorities": [ { "value": "critical", "postCount": 8 } ]
}
```

`value` is what you send back as `?category=` or `?ward=`; `name` is what you
show. `icon` is a lucide icon name such as `Droplets`, not a CSS class — colours
stay in the frontend.

Every category and ward is listed, including ones with no reports, and
`postCount` says which. A dropdown that hides empty options cannot be used to
find out that a ward has filed nothing.

`postCount` counts all visible reports, **not** the current filter selection.
True faceted counts that shrink as you narrow would mean re-running the filtered
query once per option, which is a different and much more expensive feature.

Safe to cache for a few minutes. It changes only when a category or ward is added.

---

---

## `GET /api/v1/posts/:code`

One report, with everything the detail page needs: the full gallery, the status
timeline, and four related reports. Public, and a token adds `likedByMe`.

### Addressing a report

`:code` is a **tracking code** — `OCV-2026-000123`. Case-insensitive, so a code
pasted out of an email works.

A numeric id is accepted too (`/posts/30`), but prefer the tracking code in any
URL a person can see. The primary key is sequential, so a public URL built from
it tells anybody who looks roughly how many reports the platform has ever
received. The code carries no such signal.

| You send | Result |
| --- | --- |
| `OCV-2026-000001` | the report |
| `ocv-2026-000001` | the same report |
| `30` | the same report, by id |
| `OCV-9999-999999` | `404` |
| `999999` | `404` |
| `OCV_2026_1`, `not a code` | `400` — reads as a typo rather than a missing report |

A `404` is the same whether the report never existed or was moderated away. A
distinct "this was removed" would tell its author their report was deleted, and
tell everybody else that a given code was once real.

### Response

```json
{
  "post":    { /* every list field, plus media.gallery and timeline */ },
  "related": [ /* up to 4 list items */ ]
}
```

`post` is a **superset of a list item** — same fields, same names, same
nullability — plus the two below. So your card type and your detail type can
extend one another rather than being kept in step by hand.

**`media.gallery`** — every attachment, in sort order:

```json
"media": {
  "image": "/road_surface.jpeg",
  "video": "https://lorem.video/...",
  "durationSecs": 32,
  "count": 4,
  "gallery": [
    { "type": "image", "url": "/road_surface.jpeg",      "thumbnailUrl": null,                 "durationSecs": null },
    { "type": "image", "url": "/residential_street.jpeg","thumbnailUrl": null,                 "durationSecs": null },
    { "type": "video", "url": "https://lorem.video/...", "thumbnailUrl": "/road_surface.jpeg", "durationSecs": 32 }
  ]
}
```

`image`, `video`, `durationSecs` and `count` are the same shortcuts the list
sends, so a detail header needs no special case. `gallery` is the full set.

**`timeline`** — the status history, oldest first, which is how it reads:

```json
"timeline": [
  { "id": "34", "fromStatus": null,      "toStatus": "pending",     "title": "Report submitted",
    "note": "Received and queued for triage.", "actor": { "id": "2", "name": "Platform User" },
    "createdAt": "2026-10-07T09:37:05.125Z" },
  { "id": "78", "fromStatus": "pending", "toStatus": "pending",     "title": "Routed automatically",
    "note": null, "actor": null, "createdAt": "2026-10-07T09:42:05.125Z" },
  { "id": "60", "fromStatus": "pending", "toStatus": "in_progress", "title": "Status changed to in progress",
    "note": "Reviewed by the duty officer.", "actor": { "id": "1", "name": "Platform Admin" },
    "createdAt": "2026-10-07T11:37:05.125Z" }
]
```

`fromStatus` is `null` on the first entry — the report was created, not moved.
`note` is often `null`. `actor` is `null` for an automated step, for an actor
whose account has since been deleted, **and** for the author's own entry on an
anonymous report — otherwise the timeline would print the name that `author: null`
just withheld. Staff steps on an anonymous report are still named, because those
people are acting officially.

`related` is up to four reports: same category first, newest of anything else to
fill the row. The padding is deliberate — a category with one report would
otherwise leave the section empty, which reads as a bug rather than as a quiet
category. These are list items, so they drop straight into the card you already
have.

### Reading a report counts a view

This is the one endpoint that writes. Each successful read increments
`view_count`, and the response carries the new number, so a reader sees their own
visit counted rather than lagging by one. Nothing else in the API touches it:
`GET /posts`, `/posts/filters` and `/posts/:code/comments` all leave it alone.

No deduplication. A refresh counts twice; a crawler counts once per crawl. Doing
better needs a record of who has viewed what inside some window, which is a table
and a decision about how long the window is. The column is a cache of engagement,
not an audited figure.

### Soft-deleted reports

Invisible by default — `404` for everyone. `?includeDeleted=true` returns them,
and is **super admin only** (`403` otherwise, even signed out). Same parameter,
same rule as on the list.

| Status | When |
| --- | --- |
| `200` | found |
| `400` | `:code` is not a plausible tracking code or id |
| `403` | `includeDeleted=true` without a super admin token |
| `404` | no such report, or it is soft-deleted and you did not ask for those |

---

## `GET /api/v1/posts/:code/comments`

A page of comment threads on one report. Public; a token fills in `likedByMe`.

`:code` resolves exactly as it does above, including the `400`/`404` behaviour.
A wrong code gets a `404` rather than an empty list — "no comments yet" is a
misleading answer to a URL that was wrong.

### Parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `page` | `1` | positive integer |
| `limit` | `20` | positive integer, max `100` |

Blank values mean "no opinion" here too, so `?page=&limit=` is a valid request
for page 1.

### Response

```json
{
  "comments": [
    {
      "id": "1",
      "postId": "30",
      "message": "Hit this on Saturday night and bent a rim.",
      "likeCount": 14,
      "likedByMe": false,
      "author": {
        "id": "1", "name": "Platform Admin", "avatarUrl": null,
        "role": "super_admin", "departmentId": null
      },
      "createdAt": "2026-10-07T07:37:05.125Z",
      "updatedAt": "2026-10-07T07:37:05.125Z",
      "replies": [
        { "id": "4", "postId": "30", "message": "Keep the repair invoice...",
          "likeCount": 5, "likedByMe": true,
          "author": { "id": "2", "name": "Platform User", "avatarUrl": null,
                      "role": "user", "departmentId": null },
          "createdAt": "...", "updatedAt": "..." }
      ]
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20,
  "pageCount": 1
}
```

Oldest first, which is how a conversation reads.

### Four things to know

**1. `total` counts top-level comments only** — that is what the pages are over.
The all-in number including replies is `post.counts.comments` on the report
itself. For the fixture above: `total` is `3`, `counts.comments` is `5`.

**2. Replies are never paginated.** Every reply to a thread on the current page
arrives in full. Nesting is capped at one level and threads are a handful of
messages long, so a "show more" control inside each thread would be ceremony.
A reply has no `replies` key — three-deep threads are unrepresentable, not merely
discouraged.

**3. Soft-deleted comments are absent,** both top-level ones and replies, and
they do not count toward `total`.

**4. `role` is the account role, not a display label.** It is `user` or
`super_admin`. The mock data's `CommenterRole` — "Resident", "Field Inspector",
"Municipal Officer", "Ward Councillor" — describes a person's relationship to a
report, and nothing in the schema records that. Derive what you need:

```ts
// isOfficial in the mock shape. departmentId is the real signal: staff belong to
// a department, residents do not.
const isOfficial = comment.author.departmentId !== null || comment.author.role === "super_admin";
```

`time: "4 hours ago"` is `createdAt` formatted on the client, and `initials`
comes from `author.name`.

## Wiring up the reports page

`app/reports/page.tsx` currently holds `posts` from `data/mock-data.ts` in state
and filters in a `useMemo`. The move is to let the URL hold the filter state and
let the server do the filtering, which is also what makes the ward deep link
(`/reports?ward=...`) and the browser back button work.

Two routes to the data:

- **Through the Next server** (recommended). `likedByMe` and `mine` need the
  access token, which lives in an httpOnly cookie the browser cannot read, so
  anything involving the signed-in reader has to go this way. One code path.
- **Straight from the browser** using `NEXT_PUBLIC_API_URL`. CORS already allows
  `http://localhost:3000`, and the feed is public. But `likedByMe` is always
  `false` and `mine` is unavailable, so this only suits a signed-out view.

### Fields the API does not provide

`PostItem` in `types/index.ts` is a mock shape, and some of it is presentation
rather than data. These have no API equivalent **by design**:

| `PostItem` field | Why not, and what to do |
| --- | --- |
| `tagBg`, `tagText` | Tailwind class names. Derive from `category.slug` in the frontend; the API has no business shipping CSS |
| `date` | Use `createdAt` (ISO) and format it where it is rendered |
| `updatedAt: "2 hours ago"` | The API sends ISO; make the relative string on the client |
| `reporterInitials` | Derive from `author.name`. Remember `author` is `null` when anonymous |
| `tag` | `category.name` |
| `location` | `location.address` |
| `desc` | `description` |
| `code` | `trackingCode` |
| `comments`, `likes`, `views` | `counts.comments`, `counts.likes`, `counts.views` |
| `category: "Latest" \| "Most Commented" \| ...` | Not a category — it is a feed tab. Use `sort` instead |
| `details[]` | There is one `description` column, not an array. Split it: `description.split(/\n{2,}/)` |
| `gallery[]` | `media.gallery` on the detail endpoint |
| `updates[]` | `timeline` on the detail endpoint |

### A sensible page URL

```
/reports?search=pothole&category=roads&status=pending&ward=ward-22&page=2
```

Those names are exactly the API's, so the page can forward its own
`searchParams` almost verbatim. See the worked example below.

# Shared

---

## Wiring up the detail page

`app/issues/[id]/page.tsx` looks up `posts.find(item => item.id === id)` from
`data/mock-data.ts`, filters `postComments` by `postId`, and builds
`relatedPosts` itself. All three now come from the API, and `related` arrives
already built.

Two changes worth making while you are in there:

**Use the tracking code as the route param.** The folder is `[id]` and the mock
ids are `"1"`, `"2"`. The endpoint accepts both, so nothing breaks either way, but
`/issues/OCV-2026-000123` does not advertise how many reports exist. Renaming the
segment to `[code]` is a one-line change to the folder and the `params` type.

**Drop `generateStaticParams`.** It currently prerenders a page per mock post. A
report's status, counts and timeline all change, and the view counter increments
on read, so this page wants to be dynamic.

`notFound()` still works: a `404` from the API is `result.ok === false` with
`status: 404`, which is the cue to call it.

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

## Worked examples

### Updating a profile

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

### Reading the reports page

A server component, so the filters live in the URL and the signed-in reader gets
`likedByMe`. Not written to disk — the frontend is untouched.

```ts
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/** The response envelope. Worth adding to types/index.ts alongside PostItem. */
interface PostListResponse {
  posts: PublicPost[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // The page's parameter names are the API's, so this forwards rather than
  // translates. Blank values are safe to pass straight through.
  const query = new URLSearchParams();
  for (const key of ["search", "category", "ward", "status", "priority", "sort", "page"]) {
    const value = params[key];
    if (typeof value === "string") query.set(key, value);
  }

  const token = await getAccessToken();

  // Both at once: the feed does not have to wait for the dropdown options.
  const [feed, filters] = await Promise.all([
    apiFetch<PostListResponse>(`/posts?${query}`, { token }),
    apiFetch<FilterOptions>("/posts/filters"),
  ]);

  if (!feed.ok) {
    // A 400 here means a filter value in the URL is not valid — somebody edited
    // it by hand, or a stale link. Showing the empty state beats an error page.
    return <EmptyState message={feed.error.message} />;
  }

  return <ReportsList data={feed.data} options={filters.ok ? filters.data : null} />;
}
```

`token` is passed even though the endpoint is public: it is what turns on
`likedByMe`, and `apiFetch` simply omits the header when there is no session.

For the citizen dashboard it is the same call with `mine=true`:

```ts
await apiFetch<PostListResponse>("/posts?mine=true&sort=newest&limit=10", { token });
```

### Reading one report

The detail page needs the report and its comments. They are two calls, so fire
them together — neither depends on the other.

```ts
import { notFound } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

interface PostDetailResponse {
  post: PublicPostDetail;
  related: PublicPost[];
}

interface CommentsResponse {
  comments: PublicCommentThread[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const token = await getAccessToken();

  const [detail, comments] = await Promise.all([
    apiFetch<PostDetailResponse>(`/posts/${code}`, { token }),
    apiFetch<CommentsResponse>(`/posts/${code}/comments`, { token }),
  ]);

  // 404 means no such report, or it was moderated away — the same answer either
  // way, deliberately. A 400 means the code in the URL is malformed, which is
  // also a page that does not exist as far as a visitor is concerned.
  if (!detail.ok) {
    if (detail.status === 404 || detail.status === 400) notFound();
    throw new Error(detail.error.message);
  }

  return (
    <IssueDetails
      post={detail.data.post}
      related={detail.data.related}
      // A failed comment fetch should not take the page down with it: the report
      // is the point, the discussion is not.
      comments={comments.ok ? comments.data.comments : []}
    />
  );
}
```

Two notes on the component:

```ts
// details[] in the mock shape. One description column, blank lines between
// paragraphs, so the split happens where it is rendered.
const paragraphs = post.description.split(/\n{2,}/).filter(Boolean);

// The media carousel already has what it needs; no need to merge image into
// gallery the way the mock version does, because gallery already contains it.
const items = post.media.gallery;
```

Do not call the detail endpoint to build a card — it counts a view every time.
Use `GET /posts` for anything that renders more than one report.

## Things this does not do

Called out so nothing here is mistaken for an oversight.

### Account

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

### Reports

- **No writing, anywhere.** Creating a report, liking one, posting a comment or a
  reply, liking a comment, changing a status and soft-deleting are all
  unimplemented. `ReportForm.tsx` has nowhere to post, and the like and reply
  controls on the detail page can only ever update local state. Every read the
  detail page needs now exists; none of its buttons do.
- **Views are not deduplicated.** Every read of `GET /posts/:code` counts, so a
  refresh counts twice. See that endpoint for why.
- **Reads cost a constant but chunky number of queries.** A detail page is 17
  statements, 19 signed in — constant regardless of how many gallery items,
  timeline entries or related posts come back, which I measured rather than
  assumed. Prisma issues one query per relation by default; its `relationJoins`
  preview feature collapses them into joins if this ever matters.
- **No admin override on anonymity.** `author` is `null` for a super admin too.
  Moderating an anonymous report needs a deliberate, separately audited path, not
  a query parameter on the public feed — otherwise the anonymity is decorative.
- **No `department` or `assignedOfficer` filter.** Both are on every post, but
  neither is a filter the reports page has today. Say the word; each is a line.
- **`postCount` on `/filters` is not faceted.** It counts all visible reports,
  not the current selection.
- **`search` does not scale.** Case-insensitive `contains` across five columns is
  a sequential scan. It needs `pg_trgm` or a `tsvector` column before the table
  gets large.
- **No category or ward management.** `/filters` reads them; nothing creates them
  except the seed.
