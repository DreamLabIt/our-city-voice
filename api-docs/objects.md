# Objects

The shapes that come back. Endpoint files link here rather than repeating them.

- [`User`](#user)
- [`Report`](#report) — a list item
- [`ReportDetail`](#reportdetail) — a `Report` plus the timeline
- [`ReportSuggestion`](#reportsuggestion) — a search candidate
- [`Comment` and `CommentThread`](#comment-and-commentthread)
- [`FilterOptions`](#filteroptions)

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

Returned by [`GET /posts/:code/comments`](endpoints/list-report-comments.md).

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
