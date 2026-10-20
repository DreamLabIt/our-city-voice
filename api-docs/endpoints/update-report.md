# `PATCH /posts/:code`

Edits a report that was already filed. Partial: send only the fields that changed
and the rest are left as they were. Returns the full updated report.

**Auth: required.** Only the report's author, or a super admin, may edit it.

## Who can edit

`posts.user_id` records who filed the report, so the rule is one comparison and one
role check:

- the signed-in account is the author → allowed
- the signed-in account is a `super_admin` → allowed, on any report
- anything else → `403`, and the report is left untouched

An anonymous report is still owned by the account that filed it, so the author can
edit their own anonymous report even though `author` reads `null`. Ownership is
about the row, not what the public response shows.

`:code` is the usual identifier: a tracking code (`OCV-2026-000123`) or the numeric
id. A malformed one is a `400`.

## Request body

Everything is optional, but **send at least one field** — an empty body is a `400`.
Validated strictly, so an unknown key is a `400` rather than silent.

```jsonc
{
  "title": "Sinkhole reopening after the last patch",   // optional, 6–160 chars
  "description": "Second collapse this month.",           // optional, 15–5000 chars
  "category": "roads",                                    // optional, a category slug
  "ward": "ward-10",                                      // optional, a ward code
  "priority": "high",                                     // optional, low|medium|high|critical
  "isAnonymous": false,                                   // optional
  "location": {                                            // optional, any subset
    "street": null,                                        // null clears
    "city": "Toronto",                                     // NOT NULL — cannot be null
    "address": "400 Front St W",                           // NOT NULL — cannot be null
    "postalCode": "M5V 2T6",                               // null clears
    "latitude": 43.812345,                                 // pair — see below
    "longitude": -79.287654
  },
  "media": [ /* the full new set, same item shape as POST /posts */ ] // optional
}
```

### What an edit cannot change

`status`, `assignedOfficerId` and `departmentId` are **absent from the schema** and
therefore rejected as unknown keys. Status is the officer workflow; routing is
derived, not typed in. The tracking code is fixed for the life of the report. To
move a report's status, a super admin uses
[`PATCH /posts/:code/status`](update-report-status.md).

### Absent and `null` are different

Same rule as [`PATCH /me`](update-current-user.md): omitting a key leaves the
column alone, `null` clears it — but only where the column is nullable.

```jsonc
{ "title": "New title" }                          // everything else untouched
{ "location": { "postalCode": null } }            // clears the postal code only
{ "location": { "city": null } }                  // 400 — city is NOT NULL
```

Inside `location`, `city` and `address` may be *sent* (to change them) but never as
`null`. `street` and `postalCode` accept `null` to clear. `latitude` and `longitude`
are handled as a pair: send both to move the pin, or both as `null` to remove it. A
lone coordinate is a `400`, so a form field cannot half-clear the point.

### `category` and `ward` are slugs and codes

Same as [`POST /posts`](create-report.md): match against the `value` fields of
[`GET /posts/filters`](report-filter-options.md). A value that does not exist is a
`400` naming the field. When the category **actually changes**, the report's
department moves with it (`category.default_department_id`), or clears when the new
category has no default — routing follows the category, always. Resubmitting the
same category is a no-op and leaves a department an officer reassigned by hand
alone, so an edit form that sends every field it rendered is safe.

### Sending `media` replaces the whole set

There is no per-item add or remove. A `media` array is the complete set that should
remain: the server deletes the report's existing media rows and creates these.
Omitting `media` leaves the attachments alone, and sending `[]` clears them. The
upload flow is the one from [create-report.md](create-report.md#3-media-is-uploaded-first-then-sent-here-by-url)
— files go to Cloudinary first, the finished URLs are what arrive here.

URLs are checked against the report's **own** rows first. An edit resubmits
attachments the API itself issued, and a stored row may hold a path filing would
refuse (seed data ships `/fixture.jpeg`-style keys), so a URL the report already
has passes untouched. Anything the report does not already have must satisfy the
same rule as filing — `https` plus an allowed host — so an edit cannot attach a
link the create path would reject. A rejection arrives as `400` with
`details["media.<n>.url"]`, same keys and messages as
[`POST /posts`](create-report.md).

## Response — `200`

```json
{
  "post": { /* Report */ }
}
```

The full updated [`Report`](../objects.md#report), so the page can replace its state
from the response. `likedByMe` reflects the **caller** — a super admin editing
somebody else's report sees their own like status, not the author's.

A `PATCH` whose new values all match what is stored returns `200` with the unchanged
report. Nothing is wrong with saving a form that was not edited.

### The timeline is not touched

[`ReportDetail.timeline`](../objects.md#timeline) is a **status** log
(`post_status_history`), append-only, and it is what makes "average time to
resolution" answerable. An edit changes no status, so it writes no entry — records
read back exactly as they were. Only
[`PATCH /posts/:code/status`](update-report-status.md) appends to it.

## Status codes

| Status | When |
| --- | --- |
| `200` | updated |
| `400` | no fields sent, validation failed, an unknown `category`/`ward`, a lone coordinate, a `null` `city`/`address`, or a new media URL that is not `https` on an allowed host. `details` is field → messages |
| `401` | no/expired token |
| `403` | signed in, but the report is not yours and you are not a super admin |
| `404` | no such report, or it was moderated away |

A `403` is safe here: the report being public means its existence is not a secret,
so the honest answer is "this one is not yours" rather than a `404` that would read
as a typo. A **soft-deleted** report is a `404` for everyone, including a super
admin — a moderated report must be restored before it can be edited, and there is no
restore endpoint yet. That is deliberate rather than an edge case to paper over.

## Cost

A read, then — only when `media` is sent — a read of the report's stored
attachment keys, the `category`/`ward` lookups when those change, and a
transaction holding the `UPDATE` and, again only for `media`, a delete and an
insert. Nothing fancier than a single report's own rows.

## See also

- [`POST /posts`](create-report.md) — filing a report, and the field-by-field mapping
- [`DELETE /posts/:code`](delete-report.md) — removing one instead of editing it
- [`GET /posts/:code`](get-report.md) — the same `Report` shape, plus the timeline
</content>
