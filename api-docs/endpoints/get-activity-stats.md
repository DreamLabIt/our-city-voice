# `GET /stats/activity`

The landing page's "Community Activity" panel: this year's totals, the month just
gone, and the posts-per-month bars behind `components/landing/CommunityActivity.tsx`.

**Auth: none.** No parameters.

## Response — `200`

```json
{
  "activity": {
    "year": 2026,
    "reports": 128,
    "comments": 391,
    "activeUsers": 74,
    "reportsThisMonth": 16,
    "reportsLastMonth": 13,
    "reportsChangePercent": 23.1,
    "monthly": [
      { "month": "Jan", "count": 8 },
      { "month": "Feb", "count": 11 },
      { "month": "Mar", "count": 14 },
      { "month": "Apr", "count": 9 },
      { "month": "May", "count": 19 },
      { "month": "Jun", "count": 12 },
      { "month": "Jul", "count": 10 },
      { "month": "Aug", "count": 7 },
      { "month": "Sep", "count": 9 },
      { "month": "Oct", "count": 16 },
      { "month": "Nov", "count": 0 },
      { "month": "Dec", "count": 0 }
    ]
  }
}
```

Field reference: [`ActivitySummary`](../objects.md#activitysummary).

## What each number is

- **`reports`** — reports filed this year, soft-deleted ones excluded.
- **`comments`** — the cached `commentCount` summed across this year's reports.
  Comments and replies both move it, so a reply counts as a comment. It counts
  every comment on a this-year report regardless of when the comment was made.
- **`activeUsers`** — distinct people who filed at least one report this year. A
  resident with nine reports counts once. This is the definition the word
  "active" is standing in for; it is deliberately not "everyone with an account".
- **`reportsThisMonth` and `reportsLastMonth`** — the current and previous
  calendar month. In January, `reportsLastMonth` is December of the year before,
  so the chart steps down and the counter does not.
- **`reportsChangePercent`** — the month-over-month change, signed, one decimal.
  It is **`null` when last month had no reports**: "up 100%" from a base of zero
  is noise, so the client shows no badge rather than a made-up one.
- **`monthly`** — always twelve rows, `Jan` to `Dec`, fills included. A month in
  the future, or one with no reports, is a `0`, not a missing bar.

## The year is UTC, and fixed

The counters and bars cover the **current calendar year in UTC**. The database
stores `timestamptz`, so a report filed late on the 31st belongs to the same UTC
month for every reader — a per-viewer timezone would make the same bar chart
disagree with itself between two people. `year` is echoed back so the "This Year"
label is never a guess.

## Cost

A constant set of counted buckets — one per month plus a handful of totals — each
an index range scan. It does not grow with the number of reports in the year.

## See also

- [`GET /stats`](get-statistics.md) — the full breakdown
- [`GET /stats/admin`](get-admin-overview.md) — this same panel inside the admin payload
