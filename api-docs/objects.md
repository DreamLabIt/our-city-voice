# Objects

The shapes that come back. Endpoint files link here rather than repeating them.

- [`User`](#user)
- [`Report`](#report) — a list item
- [`ReportDetail`](#reportdetail) — a `Report` plus the timeline
- [`ReportSuggestion`](#reportsuggestion) — a search candidate
- [`Comment` and `CommentThread`](#comment-and-commentthread)
- [`LikeResult`](#likeresult) — the answer to a like or unlike
- [`ContactCategory`](#contactcategory) — a contact-form option
- [`ContactMessage`](#contactmessage) — a contact-form submission
- [`FilterOptions`](#filteroptions)
- [`ReportStatistics`](#reportstatistics) — the report numbers
- [`ActivitySummary`](#activitysummary) — the landing page's counters and chart
- [`AdminOverview`](#adminoverview) — the admin dashboard payload

See [conventions.md](conventions.md) for the rules behind ids, dates and enums.

---

## `User`

Already declared as `AuthUser` in `frontend/types/index.ts`, and **unchanged**, so
no type edits are needed.

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
[not-implemented.md](not-implemented.md).

---

## `Report`

What `GET /posts` returns in its array, and what `related` holds on a detail
response. The shape mirrors the `Post` model 1:1: the Post columns
(`street`/`city`/`address`/`postalCode`/`latitude`/`longitude`,
`viewCount`/`likeCount`/`commentCount`) stay flat under their own names,
reduced relation rows appear as the objects below, and `media` is the `Media`
relation itself — one entry per row — rather than a summary object.

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
  "street": null,
  "city": "Toronto",
  "address": "400 Front St W",
  "postalCode": "M5V 3K2",
  "latitude": 43.812345,
  "longitude": -79.287654,
  "viewCount": 51,
  "likeCount": 1,
  "commentCount": 0,
  "likedByMe": false,
  "media": [
    { "id": "9",  "type": "image", "storageKey": "/road_surface.jpeg",       "thumbnailKey": null,                 "mimeType": "image/jpeg", "sizeBytes": "1048576", "durationSecs": null, "sortOrder": 0, "url": "/road_surface.jpeg",       "thumbnailUrl": null },
    { "id": "10", "type": "video", "storageKey": "video/surface-crack.mp4",   "thumbnailKey": "/road_surface.jpeg", "mimeType": "video/mp4",  "sizeBytes": "5242880", "durationSecs": 47, "sortOrder": 1, "url": "https://lorem.video/...",   "thumbnailUrl": "/road_surface.jpeg" }
  ],
  "resolvedAt": null,
  "createdAt": "2026-10-07T10:13:40.253Z",
  "updatedAt": "2026-10-07T10:13:40.253Z"
}
```

**Nullable:** `department`, `author`, `assignedOfficer`, `street`, `postalCode`,
`latitude`, `longitude`, `resolvedAt`; and per media item `thumbnailKey`,
`durationSecs`, `thumbnailUrl`.

### `media` maps the `Media` relation one-to-one

Each entry is one `Media` row: `type` (`image`/`video`), the bucket `storageKey`,
`thumbnailKey` (a video's poster frame), `mimeType`, `sizeBytes`, `durationSecs`
(videos only) and `sortOrder`. Rows arrive in `sortOrder` order, so the first
entry is the card's hero. `id` and `sizeBytes` are BigInts and therefore strings
on the wire, like the report id.

### `media.url` and `media.thumbnailUrl` are derived

`storageKey` holds a bucket key (or a fixture path), never a URL; `url` and
`thumbnailUrl` are built from it at read time so a bucket or CDN change never
rewrites stored rows. An absolute URL and a root-relative path
(`/road_surface.jpeg`, which is what fixtures hold) pass through untouched;
anything else gets `MEDIA_BASE_URL` in front of it. That variable is empty in
development, so a bare bucket key comes back unprefixed and unusable — it needs
a value once real uploads start storing keys.

### An anonymous report has no author

When `isAnonymous` is `true`, `author` is `null` — **for everyone, super admins
included.** The name is never put in the response, so a component that forgets to
check `isAnonymous` still cannot leak it. There is deliberately no admin override;
see [not-implemented.md](not-implemented.md).

The same rule reaches into `ReportDetail.timeline`.

### `likedByMe`

Whether the caller has liked it. Always `false` for a signed-out reader, which is
also what the like button should show them. `likeCount` is the public total and
is unaffected by who is asking.

Set it through [`POST`/`DELETE /posts/:code/like`](endpoints/like-report.md) for a
report and [`POST`/`DELETE /posts/:code/comments/:commentId/like`](endpoints/like-comment.md)
for a comment; both return the updated pair in a [`LikeResult`](#likeresult).

---

## `ReportDetail`

Returned by [`GET /posts/:code`](endpoints/get-report.md). It is a **superset of
`Report`** — same fields, same names, same nullability — plus `timeline` below.
There is no separate "gallery" shape to merge: `media` on a detail is already
the full set of `Media` rows, so a card type and a detail type extend one
another rather than being kept in step by hand.

### `timeline`

The status history, oldest first, which is how it reads.

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
`note` is often `null`.

`actor` is `null` in three cases: an automated step, an actor whose account has
since been deleted, **and the author's own entry on an anonymous report**. That
last one matters: the first entry is almost always "Report submitted" by the
author, so naming them would print the name `author: null` just withheld. Staff
steps on an anonymous report are still named, because those people are acting
officially.

The table is append-only. The first row is written when the report is filed, and
[`PATCH /posts/:code/status`](endpoints/update-report-status.md) adds one row each
time a super admin moves the status, which is what produces the
"Status changed to …" entries. An edit never adds a row.

---

## `ReportSuggestion`

Returned by [`GET /posts/suggestions`](endpoints/suggest-reports.md). A trimmed
[`Report`](#report): enough for a dropdown row and a link, without the media,
counts or description a card does not need. At most six come back, most relevant
first.

```json
{
  "id": "28",
  "trackingCode": "OCV-2026-VID001",
  "title": "Sinkhole opening up at the intersection",
  "status": "pending",
  "category": { "id": "1", "name": "Roads", "slug": "roads", "icon": "Road" },
  "ward":     { "id": "1", "name": "Ward 10 (Spadina Fort York)", "code": "ward-10" },
  "address": "400 Front St W"
}
```

`id`, `trackingCode`, `title`, `category`, `ward`, `address` and `status` are the
same fields with the same shapes as on `Report` — `category` and `ward` are the
full reduced objects, not names — so a suggestion can be swapped into any place
that already reads those fields. What is dropped is the rest: `description`,
`priority`, `author`, `media`, the counts and the timestamps. Link with
`trackingCode`; there is nothing here to build a detail page from, and you would
not want to — the suggestion is a hop, not a render.

---

## `Comment` and `CommentThread`

Returned by [`GET /posts/:code/comments`](endpoints/list-report-comments.md), and
the bare `Comment` is what [`POST …/comments`](endpoints/create-comment.md) and
[`POST …/comments/:commentId/replies`](endpoints/reply-to-comment.md) return for
the row they just created.

```json
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
  "replies": [ /* Comment[] — no replies key of their own */ ]
}
```

A `CommentThread` is a `Comment` with `replies`. A reply is a plain `Comment` and
has **no `replies` key at all**, so a three-deep thread is unrepresentable rather
than merely discouraged — nesting is capped at one level.

### `role` is the account role, not a display label

It is `user` or `super_admin`. The mock data's `CommenterRole` — "Resident",
"Field Inspector", "Municipal Officer", "Ward Councillor" — describes a person's
relationship to a report, and nothing in the schema records that. Derive what you
need:

```ts
// isOfficial in the mock shape. departmentId is the real signal: staff belong to
// a department, residents do not.
const isOfficial = comment.author.departmentId !== null || comment.author.role === "super_admin";
```

`time: "4 hours ago"` is `createdAt` formatted on the client, and `initials` comes
from `author.name`.

---

## `LikeResult`

Returned by the four like/unlike endpoints — [`POST`/`DELETE /posts/:code/like`](endpoints/like-report.md)
and [`POST`/`DELETE /posts/:code/comments/:commentId/like`](endpoints/like-comment.md).
Just enough to update a button in place; it is not a [`Report`](#report) or a
[`Comment`](#comment-and-commentthread).

```json
{ "likedByMe": true, "likeCount": 15 }
```

`likedByMe` is `true` after a like and `false` after an unlike — the state the
caller asked for, not a fresh read. `likeCount` is the new public total. Because
both directions are idempotent, this pair is safe to merge into whatever the page
already holds: it is the truth after the call, whether or not anything changed.

---

## `ContactCategory`

One option in the contact form's dropdown, from
[`GET /contact/categories`](endpoints/list-contact-categories.md).

```json
{ "id": "2", "name": "Report a Problem" }
```

`name` is what you show; `id` is what you send back as `categoryId` on
[`POST /contact/messages`](endpoints/create-contact-message.md). There is no slug
on a contact category — unlike a report `category`, it is never used as a filter —
so the id is the value, not the name.

---

## `ContactMessage`

A stored contact-form submission. Returned by
[`POST /contact/messages`](endpoints/create-contact-message.md) for the row just
created, and listed by [`GET /contact/messages`](endpoints/list-contact-messages.md).

```json
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
```

`category` is a full reduced object, not a name, so the dashboard can render the
badge without a second lookup. `phone` is `null` when the sender left it blank.
`email` is lowercased.

**`handledAt` is always `null` today** — the column and the field exist for a
New/Handled state, but nothing sets it. See
[not-implemented.md](not-implemented.md).

---

## `FilterOptions`

Returned by [`GET /posts/filters`](endpoints/report-filter-options.md).

```json
{
  "categories": [
    { "id": "1", "name": "Roads", "value": "roads", "icon": "Road", "postCount": 9 },
    { "id": "5", "name": "Parks", "value": "parks", "icon": "Trees", "postCount": 0 }
  ],
  "wards": [
    { "id": "2", "name": "Ward 22 (Scarborough Agincourt)", "value": "ward-22", "postCount": 8 }
  ],
  "statuses":   [ { "value": "pending",  "postCount": 9 } ],
  "priorities": [ { "value": "critical", "postCount": 8 } ]
}
```

`value` is what you send back as `?category=` or `?ward=`; `name` is what you
show. `icon` is a lucide icon name such as `Droplets`, not a CSS class — colours
stay in the frontend.

---

## `ReportStatistics`

Returned by [`GET /stats`](endpoints/get-statistics.md) and
[`GET /stats/me`](endpoints/get-my-statistics.md), and as `stats` inside
[`GET /stats/admin`](endpoints/get-admin-overview.md). It is the
`PlatformStatistics` shape `app/statistics` already builds locally, so the
reducer's output and this response are interchangeable — the only difference is
that the two dates arrive as ISO strings over HTTP.

```json
{
  "total": 128,
  "open": 71,
  "resolved": 52,
  "resolutionRate": 40.6,
  "byStatus":   [ { "status": "pending", "count": 43 } ],
  "byPriority": [ { "label": "Critical",   "count": 18 } ],
  "byCategory": [ { "label": "Roads",      "count": 9 } ],
  "byWard":     [ { "ward": "Ward 10 (Spadina Fort York)", "total": 8,
                    "pending": 3, "inProgress": 2, "resolved": 3, "rejected": 0 } ],
  "upvotes": 512,
  "comments": 391,
  "views": 2884,
  "medianResolutionHours": 52.5,
  "resolutionSampleSize": 24,
  "firstReportDate": "2026-01-02T08:11:00.000Z",
  "latestReportDate": "2026-10-14T09:12:04.512Z"
}
```

The sub-shapes, in TypeScript because the JSON above is trimmed:

```ts
interface StatusCount { status: "pending" | "in_progress" | "resolved" | "rejected"; count: number; }
interface CountRow    { label: string; count: number; }
interface WardBreakdown {
  ward: string;       // the ward's name, not its code
  total: number;
  pending: number;
  inProgress: number; // camelCase, unlike the status enum
  resolved: number;
  rejected: number;
}
```

`upvotes`, `comments` and `views` are the sums of the counters cached on each
report — `likeCount`, `commentCount` and `viewCount`. `views` counts every read of
a detail page, crawlers included; see
[not-implemented.md](not-implemented.md).

`open` is `total - resolved - rejected` — rejected is closed, not open.
`resolutionRate` is a percentage to one decimal, `0` when there are no reports.
`medianResolutionHours` and `resolutionSampleSize` come as a pair: the sample is
`0` and the median is `null` until something is resolved. Both dates are `null`
on an empty platform.

Every figure excludes soft-deleted reports.

---

## `ActivitySummary`

Returned by [`GET /stats/activity`](endpoints/get-activity-stats.md), and as
`activity` inside [`GET /stats/admin`](endpoints/get-admin-overview.md).

```json
{
  "year": 2026,
  "reports": 128,
  "comments": 391,
  "activeUsers": 74,
  "reportsThisMonth": 16,
  "reportsLastMonth": 13,
  "reportsChangePercent": 23.1,
  "monthly": [ { "month": "Jan", "count": 8 }, { "month": "Feb", "count": 11 } ]
}
```

`MonthCount` is `{ month, count }`, where `month` is a three-letter label and
`count` a number. `monthly` is always twelve rows, `Jan` to `Dec`, gaps included.

Everything is scoped to the current calendar year in UTC. `activeUsers` is the
number of distinct people who filed at least one report that year.
`reportsChangePercent` is signed and one decimal, and `null` when last month had
no reports.

---

## `AdminOverview`

Returned by [`GET /stats/admin`](endpoints/get-admin-overview.md). The wrapper the
admin dashboard reads.

```json
{
  "stats": { /* ReportStatistics */ },
  "moderation": { "deleted": 7 },
  "users": { "total": 312, "superAdmins": 4, "newThisMonth": 21 },
  "contactMessages": { "total": 96, "unhandled": 12 },
  "activity": { /* ActivitySummary */ }
}
```

`stats` and `activity` are the same public shapes documented above.
`moderation.deleted` counts soft-deleted reports — the only place they are
visible. `users.newThisMonth` and the whole of `users` and `contactMessages` are
counting figures assembled for this endpoint alone; the area is small enough that
they need no named object of their own.
