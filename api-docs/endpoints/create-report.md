# `POST /posts`

Files a new report. The report the form has been collecting becomes a `posts` row
— with a tracking code the person can quote, a timeline entry saying it was
submitted, and any already-uploaded photos or video attached to it.

**Auth: required.** A report is always filed by an account: `posts.user_id` is
`NOT NULL`, and the authorising account *is* the author. There is no signed-out way
to file a report.

## Three mapping gotchas before the body

### 1. The form sends display names; the API takes slugs and codes

| Form value (`ReportIssueFormData`) | Send on the API |
| --- | --- |
| `category: "Roads & Potholes"` | the **slug** — `?category=`-style, e.g. `roads` |
| `priority: "High"` | the **enum value** — `high` |
| `location: "Near Station Road, Ward 4"` | split into `location.address` (the text) and `location.city` |

The single `location` string has no city. The form has no city field and the
database requires one, so add a city input (or default it to the platform's
service city) before wiring this up — the API will not invent one.

Category slugs and ward codes are exactly the `value` fields of
[`GET /posts/filters`](report-filter-options.md), so drive those dropdowns from
that endpoint and send the option's `value`.

Priority just lowercases (`"High"` → `high`); the enum values are
`low | medium | high | critical`.

### 2. Reporter name, email and phone are not sent

An account filed the report, so the name/email/phone fields on the form describe
*the reporter*, not a column. Drop `reporterName`, `reporterEmail` and
`reporterPhone` from the request body entirely — the API replaces them with the
signed-in account. "Submit anonymously" is a boolean, not an alternative to
signing in.

### 3. Media is uploaded first, then sent here by URL

The API takes no files. Use the existing upload flow the frontend already has:
`useUploads`/`lib/upload.ts` pushes each file to Cloudinary through
`/api/uploads/signature`, and the finished `UploadedFile` maps onto this body:

| `UploadedFile` | Media field |
| --- | --- |
| `url` | `url` |
| `resourceType` | `type` (`image` \| `video`) |
| `bytes` | `sizeBytes` |
| `durationSeconds` | `durationSecs` (videos only) |

`mimeType` and `thumbnailUrl` are optional — `mimeType` defaults from `type`, and
`thumbnailUrl` is only useful as a video's poster frame.

## Request body

All of it is JSON (`Content-Type: application/json`), validated strictly — an
unknown key is a `400`, not silent.

```jsonc
{
  "title": "Sinkhole opening up at the intersection",  // required, 6–160 chars
  "description": "Video shows the edge collapsing.",    // required, 15–5000 chars
  "category": "roads",                                  // required, a category slug
  "ward": "ward-10",                                    // required, a ward code
  "priority": "critical",                               // optional; default "medium"
  "isAnonymous": false,                                 // optional; default false
  "location": {                                          // required
    "street": null,                                      // optional, null or ≤160 chars
    "city": "Toronto",                                   // required, ≤80 chars
    "address": "400 Front St W",                         // required, ≤240 chars
    "postalCode": null,                                  // optional, null or ≤16 chars
    "latitude": 43.812345,                               // optional, -90..90
    "longitude": -79.287654                              // optional, -180..180
  },
  "media": [                                             // optional, up to 6
    {
      "url": "https://res.cloudinary.com/ocv/…",          // required, https + allowed host
      "type": "image",                                    // "image" | "video"
      "thumbnailUrl": null,                               // optional; video poster
      "mimeType": "image/jpeg",                          // optional; defaulted from type
      "sizeBytes": 245678,                                // optional; default 0
      "durationSecs": null                                // optional; videos only
    }
  ]
}
```

`latitude` and `longitude` must arrive together — a lone coordinate is a `400`.

`category`/`ward` are matched against the **slug**/**code**, and a value that does
not exist (typo, stale option list) is a `400` naming the field — there is no
"reported to nowhere" fallback.

The server sets what a client must not: `status` starts `pending`, `isAnonymous`
defaults `false`, and `departmentId` comes from the category's default department
(`category.default_department_id`), so routing happens without the form asking.

## Response — `201`

```json
{
  "post": { /* Report */ }
}
```

The full [`Report`](../objects.md#report) that was just created —
`trackingCode` in here is the ID to show and to link to
(`/posts/OCV-2026-000124`). Read the created object off this response instead of
re-fetching, matching what the page will show.

The tracking code is `OCV-<year>-<6 digits>` (e.g. `OCV-2026-000124`). It is
allocated server-side, never accepted from the client, and a collision is retried
rather than reported.

Creation also writes the first
[`ReportDetail.timeline`](../objects.md#timeline) entry — "Report submitted". The
settled report, once fetched, will show it.

### Anonymous reports

`isAnonymous: true` stores the account as the author but the response's `author`
is `null` — including on `timeline` — so nothing leaks the name. The account is
still the row's owner as far as the database is concerned.

## Status codes

| Status | When |
| --- | --- |
| `201` | created |
| `400` | validation failed, an unknown `category`/`ward`, or a lone coordinate. `details` is field → messages |
| `401` | no/expired token |
| `503` | the API could not allocate a tracking code (should never happen in practice) |

A `400` `details` object lands each message under the field a form input maps to,
so put `details.title`, `details.description`, `details.category`,
`details.ward`, `details["location.address"]`, `details["media.0.url"]` next to
their inputs as usual — envelope in [errors.md](../errors.md).

## Cost

Three SQL statements in one transaction: a category lookup, a ward lookup, and
the post + media + timeline insert. Nothing reads back an extra row — the created
post is the select's payload.

## See also

- [`GET /posts/filters`](report-filter-options.md) — where the `category` and `ward` values come from
- [`GET /posts`](list-reports.md) — `mine=true` shows what a person has filed
- [`GET /posts/:code`](get-report.md) — the created report, once it is listed