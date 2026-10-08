# Objects

The shapes that come back. Endpoint files link here rather than repeating them.

- [`User`](#user)
- [`Report`](#report) — a list item
- [`ReportDetail`](#reportdetail) — a `Report` plus the gallery and timeline
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
response.

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

**Nullable:** `department`, `author`, `assignedOfficer`, `location.street`,
`location.postalCode`, `location.latitude`, `location.longitude`, `media.image`,
`media.video`, `media.durationSecs`, `resolvedAt`.

### An anonymous report has no author

When `isAnonymous` is `true`, `author` is `null` — **for everyone, super admins
included.** The name is never put in the response, so a component that forgets to
check `isAnonymous` still cannot leak it. There is deliberately no admin override;
see [not-implemented.md](not-implemented.md).

The same rule reaches into `ReportDetail.timeline`.

### `likedByMe`

Whether the caller has liked it. Always `false` for a signed-out reader, which is
also what the like button should show them. `counts.likes` is the public total and
is unaffected by who is asking.

### `media` is enough for a card

`image` is the first image by sort order, falling back to a video's poster frame so
a video-only report still has a thumbnail. `video` is the first video. `count` is
every attachment, so a card can show "+2". The full set is
[`ReportDetail.media.gallery`](#reportdetail).

> URLs are built from `media.storage_key`, which holds a bucket key rather than a
> URL. An absolute URL and a root-relative path (`/road_surface.jpeg`, which is
> what fixtures hold) pass through untouched; anything else gets `MEDIA_BASE_URL`
> in front of it. That variable is empty in development, so a bare bucket key
> comes back unprefixed and unusable — it needs a value once real uploads start
> storing keys.

---

## `ReportDetail`

A **superset of `Report`** — same fields, same names, same nullability — plus the
two below. So a card type and a detail type can extend one another rather than
being kept in step by hand.

Returned by [`GET /posts/:code`](endpoints/get-report.md).

### `media.gallery`

Every attachment, in sort order. `image`, `video`, `durationSecs` and `count` are
still there and mean the same thing, so a detail header needs no special case.

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

`gallery` already contains the hero image, so there is no need to merge `image`
into it the way the mock version does.

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
