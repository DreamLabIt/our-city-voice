# `GET /posts`

Every report in the database, filtered and paginated. One endpoint serves the
public reports page, the citizen dashboard and the admin dashboard, because they
are the same query with different filters — only *which rows a caller may ask for*
differs, and that is enforced per parameter below.

**Auth: optional.** A signed-out request works and returns the feed. A token adds
two things: `likedByMe` is filled in, and `mine=true` becomes available.

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `page` | `1` | positive integer |
| `limit` | `12` | positive integer, max `100` |
| `sort` | `newest` | `newest`, `oldest`, `most_liked`, `most_commented`, `most_viewed`, `recently_updated` |
| `search` | — | free text, ≤120 chars. Matches title, description, tracking code, address or city, case-insensitively |
| `category` | — | one or more category **slugs** (`roads`) |
| `ward` | — | one or more ward **codes** (`ward-22`) |
| `status` | — | one or more of `pending`, `in_progress`, `resolved`, `rejected` |
| `priority` | — | one or more of `low`, `medium`, `high`, `critical` |
| `mine` | `false` | `true`/`false`. Only your own reports. **`401` if signed out** |
| `authorId` | — | a user id. **Super admin only, `403` otherwise** |
| `includeDeleted` | `false` | `true`/`false`. Includes moderated-away reports. **Super admin only, `403` otherwise** |

`mine` and `authorId` both narrow to one author, so sending both is a `400` rather
than one silently winning.

Multi-value filters accept a single value, a comma-separated list or a repeated
key; a blank value means "no filter". Both are spelled out in
[conventions.md](../conventions.md#query-parameters).

### Why `mine` is a `401` and not an empty list

`mine=true` without a session would otherwise fall back to the whole feed, and
"my reports" returning everybody's is a privacy bug that looks like a page that
works.

### Why `authorId` is super admin only

Without the guard, the author filter is a way to enumerate everything a given
account has filed — including the reports they filed anonymously.

## Response — `200`

```json
{
  "posts": [ /* Report[] */ ],
  "total": 27,
  "page": 1,
  "limit": 12,
  "pageCount": 3
}
```

Each element is a [`Report`](../objects.md#report). Pagination semantics,
including why it is offset-based and why every sort has an id tiebreak, are in
[conventions.md](../conventions.md#pagination).

## Status codes

| Status | When |
| --- | --- |
| `200` | always, including a page past the end (empty `posts`, real `total`) |
| `400` | an invalid parameter value, or `mine` together with `authorId` |
| `401` | `mine=true` with no session |
| `403` | `authorId` or `includeDeleted` without a super admin token |

## Dashboard use

Citizen dashboard — the person's own reports:

```
/posts?mine=true&sort=newest&limit=10
```

Admin, one person's reports:

```
/posts?authorId=8
```

Admin, including moderated-away ones:

```
/posts?includeDeleted=true
```

Soft-deleted reports are invisible by default for everyone. A moderated report
should not reappear on the public feed because a filter was left off.

## Costs

Constant number of SQL statements per request regardless of `limit` — measured, not
assumed: 10 signed out, 11 signed in. The extra one looks up every like for the
page in a single batched query rather than one per row. No N+1.

`search` is a case-insensitive `contains` across five columns, which is a
sequential scan. Fine at this size; it wants a trigram index (`pg_trgm`) or a
`tsvector` column before the table gets large.

## See also

- [`GET /posts/filters`](report-filter-options.md) — the dropdown options, which you need to drive these filters
- [`GET /posts/:code`](get-report.md) — one report. Do not call it in a loop to build cards; it counts a view each time
- [guides/reports-page.md](../guides/reports-page.md)
