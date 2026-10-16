# `GET /stats/me`

The signed-in person's own reports, counted the same way as
[`GET /stats`](get-statistics.md). The citizen dashboard's overview.

**Auth: required.** No parameters. A signed-out request gets a `401`.

## What "my reports" means

Every report the caller filed, named or anonymous — authorship is `posts.user_id`
and an anonymous report still has one, so it is included. Soft-deleted reports
are not: a report removed from the public feed is not part of a public-shaped
total, and the dashboard's own list (`GET /posts?mine=true`) applies the same
rule.

## Response — `200`

The same envelope as [`GET /stats`](get-statistics.md), so one component can
render either:

```json
{ "stats": { /* ReportStatistics */ } }
```

See [`ReportStatistics`](../objects.md#reportstatistics) for every field.

A caller who has filed nothing gets a fully zeroed object rather than a `404`:
`total: 0`, `resolutionRate: 0`, the four zeroed status and priority rows, empty
`byCategory` and `byWard`, zeroed response totals, `medianResolutionHours: null`,
`resolutionSampleSize: 0`, and both dates `null`. Having nothing is a valid
answer to "what are my numbers", not an error.

## A note on the totals

`upvotes`, `comments` and `views` are the response their reports drew from
everyone else — the counters cached on their own reports. `medianResolutionHours`
is the city's resolution time across just their reports, which is the one figure
here no other endpoint gives them.

## Caching

Private and per-user. Do not share a cached copy between accounts.

## See also

- [`GET /stats`](get-statistics.md) — the same shape for the whole site
- [`GET /posts?mine=true`](list-reports.md) — the reports behind these numbers
