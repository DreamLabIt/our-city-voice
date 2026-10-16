# `GET /stats/admin`

The admin dashboard's opening payload: everything the whole-site overview needs,
in one call — the report picture, what has been moderated away, who is on the
platform, the contact inbox, and the year's activity.

**Auth: required, super admin only.** A signed-in non-admin gets a `403`, a
signed-out request a `401`. The content includes rows a citizen never sees
(deleted reports, every account, the inbox), so this is not
[`GET /stats`](get-statistics.md) with a flag.

## Response — `200`

```json
{
  "stats": { /* ReportStatistics */ },

  "moderation": { "deleted": 7 },

  "users": { "total": 312, "superAdmins": 4, "newThisMonth": 21 },

  "contactMessages": { "total": 96, "unhandled": 12 },

  "activity": { /* ActivitySummary */ }
}
```

Field references: [`ReportStatistics`](../objects.md#reportstatistics),
[`ActivitySummary`](../objects.md#activitysummary), and
[`AdminOverview`](../objects.md#adminoverview) for the wrapper.

## What the parts are

**`stats`** is exactly [`GET /stats`](get-statistics.md) — the live reports, the
same shape a citizen sees on the statistics page. It counts non-deleted reports
only, so `stats.total` is what the public sees, not the all-time high-water mark.

**`moderation.deleted`** is the count of soft-deleted reports — the difference
between what is live and what was ever filed. Every read treats a deleted report
as gone, so this counter is the only place it is visible. There is no restore
endpoint yet; see [not-implemented.md](../not-implemented.md).

**`users`** — every account, how many are super admins, and how many registered
this calendar month (UTC). Registration figures are here rather than on
[`GET /stats`](get-statistics.md) because a signed-out visitor has no business
with them.

**`contactMessages`** — the inbox: total stored, and how many are still
`handledAt: null`. Every row is unhandled today, so `unhandled === total` until a
mark-handled endpoint exists; the two fields are shipped so the dashboard is
already wired for the day it does.

**`activity`** is exactly [`GET /stats/activity`](get-activity-stats.md), the
current year in UTC. It is included here so the overview is one request rather
than five; it is the same public data, not an admin-only view of it.

## Where "the full history" comes from

The overview is meant to answer "what has this platform done", so the report
history is spread across three fields that are each already bounded:

- `stats.firstReportDate` and `stats.latestReportDate` — the span, first report
  to most recent.
- `activity.monthly` — the year's shape, month by month.
- `moderation.deleted` — what is no longer counted.

There is no single "every report ever" list here, and there does not need to be:
that list is [`GET /posts`](list-reports.md) with the admin's own filters.

## Cost

[`GET /stats`](get-statistics.md), [`GET /stats/activity`](get-activity-stats.md)
and six more counts, run together. Constant regardless of how much data there is.

## See also

- [`GET /stats`](get-statistics.md) — the live report numbers on their own
- [`GET /stats/activity`](get-activity-stats.md) — the year's shape on its own
- [`GET /contact/messages`](list-contact-messages.md) — the inbox these counts describe
