# `GET /posts/:code`

One report, with everything the detail page needs: the full gallery, the status
timeline, and four related reports.

**Auth: optional.** A token adds `likedByMe`.

> **This is the only read in the API that writes.** Each successful request
> increments the view counter. Do not call it to build cards — see
> [below](#reading-a-report-counts-a-view).

## Addressing a report

`:code` is a **tracking code** — `OCV-2026-000123`. Case-insensitive, so a code
pasted out of an email works.

A numeric id is accepted too (`/posts/30`), but prefer the tracking code in any URL
a person can see. The primary key is sequential, so a public URL built from it
tells anybody who looks roughly how many reports the platform has ever received.
The code carries no such signal.

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

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `includeDeleted` | `false` | `true`/`false`. **Super admin only, `403` otherwise** |

## Response — `200`

```json
{
  "post":    { /* ReportDetail */ },
  "related": [ /* up to 4 Report */ ]
}
```

`post` is a [`ReportDetail`](../objects.md#reportdetail) — a **superset of a list
item** plus `media.gallery` and `timeline`. So your card type and your detail type
can extend one another rather than being kept in step by hand.

`related` is up to four reports: same category first, newest of anything else to
fill the row. The padding is deliberate — a category with one report would
otherwise leave the section empty, which reads as a bug rather than as a quiet
category. These are plain [`Report`](../objects.md#report) objects, so they drop
straight into the card you already have.

`related` is not a parameter on [`GET /posts`](list-reports.md) because "four
posts, this category first, excluding this one, padded with others" is not a
filter.

## Reading a report counts a view

Each successful request increments `view_count`, and the response carries the new
number, so a reader sees their own visit counted rather than lagging by one.
Nothing else in the API touches it: `GET /posts`, `/posts/filters` and
`/posts/:code/comments` all leave it alone.

**No deduplication.** A refresh counts twice; a crawler counts once per crawl.
Doing better needs a record of who has viewed what inside some window, which is a
table and a decision about how long the window is. The column is a cache of
engagement, not an audited figure.

The practical consequence: use [`GET /posts`](list-reports.md) for anything that
renders more than one report.

## Soft-deleted reports

Invisible by default — `404` for everyone. `?includeDeleted=true` returns them and
is super admin only (`403` otherwise, including signed out). Same parameter, same
rule as on the list.

## Status codes

| Status | When |
| --- | --- |
| `200` | found |
| `400` | `:code` is not a plausible tracking code or id |
| `403` | `includeDeleted=true` without a super admin token |
| `404` | no such report, or it is soft-deleted and you did not ask for those |

For a page, treat `400` and `404` the same: both mean the URL does not name a
report a visitor can see, so call `notFound()`.

## Costs

17 SQL statements, 19 signed in — **constant** regardless of how many gallery
items, timeline entries or related reports come back. Measured, not assumed.
Prisma issues one query per relation by default; see
[not-implemented.md](../not-implemented.md).

## See also

- [`GET /posts/:code/comments`](list-report-comments.md) — the discussion, a separate call
- [guides/report-detail-page.md](../guides/report-detail-page.md)
