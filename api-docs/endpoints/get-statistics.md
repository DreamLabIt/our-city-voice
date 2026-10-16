# `GET /stats`

The whole site's report numbers: how many were filed, how they break down, and
how many have been resolved. Every figure on `app/statistics`.

**Auth: none.** No parameters.

## Why it is not computed on the client

The statistics page used to count the reports it had in hand. That works on a
mock array and stops working the moment the feed is paginated: a list only knows
its own page. The totals live here, computed in the database — counts and
group-bys, plus one ordered aggregate for the median — so a page of 12 reports
cannot produce a total of 12.

The shape is the same `PlatformStatistics` the page's local `buildStatistics()`
already returns, field for field, so the reducer can be swapped for this call
without touching the render code. The two dates arrive as ISO strings rather than
`Date` objects; everything else is a number or an array of them.

## Response — `200`

```json
{
  "stats": {
    "total": 128,
    "open": 71,
    "resolved": 52,
    "resolutionRate": 40.6,

    "byStatus": [
      { "status": "pending",     "count": 43 },
      { "status": "in_progress", "count": 28 },
      { "status": "resolved",    "count": 52 },
      { "status": "rejected",    "count": 5 }
    ],
    "byPriority": [
      { "label": "Critical", "count": 18 },
      { "label": "High",     "count": 34 },
      { "label": "Medium",   "count": 61 },
      { "label": "Low",      "count": 15 }
    ],
    "byCategory": [
      { "label": "Roads",   "count": 47 },
      { "label": "Parks",   "count": 21 },
      { "label": "Waste",   "count": 12 }
    ],
    "byWard": [
      { "ward": "Ward 22 (Scarborough Agincourt)", "total": 31,
        "pending": 12, "inProgress": 6, "resolved": 11, "rejected": 2 }
    ],

    "upvotes": 940,
    "comments": 613,
    "views": 6432,

    "medianResolutionHours": 41.5,
    "resolutionSampleSize": 52,

    "firstReportDate": "2026-01-14T08:02:11.204Z",
    "latestReportDate": "2026-10-16T05:14:39.008Z"
  }
}
```

Field reference: [`ReportStatistics`](../objects.md#reportstatistics).

## Four things to know

**`open` is not `total - resolved`.** It is `total - resolved - rejected`:
rejected is closed, not open. A report that was thrown out does not need a crew.

**`byStatus` and `byPriority` are always four rows, in a fixed order** — the
workflow order for status, severity order for priority (Critical first, whether
or not it is the biggest bucket). `byCategory` and `byWard` list only the buckets
that have a report, sorted by count descending then name, so equal counts do not
reorder between calls.

**`medianResolutionHours` is the median, not the mean,** and
`resolutionSampleSize` says how many reports it rests on so a reader can tell a
median of two from a median of two hundred. It measures filing (`createdAt`) to
resolution (`resolvedAt`); a report that is not `resolved` contributes nothing.
It is `null`, with a sample of `0`, until at least one report is resolved.

**Soft-deleted reports are excluded, everywhere.** A moderated report is gone as
far as every read is concerned, and a statistic is a read. If an empty platform
is a real state you need to show: `total` is `0`, both dates are `null`, and the
arrays are the four zeroed status/priority rows and empty category/ward lists.

## Caching

Safe to cache for a minute or two. It changes as reports are filed and moved, and
nothing here is per-viewer, so one cached copy serves everybody.

Constant number of queries regardless of how many reports exist — the medians and
breakdowns never pull rows into the app.

## See also

- [`GET /stats/me`](get-my-statistics.md) — the same shape, one person's reports
- [`GET /stats/activity`](get-activity-stats.md) — the landing page's counters and chart
- [`GET /stats/admin`](get-admin-overview.md) — this plus users, moderation and the inbox
