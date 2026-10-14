# `GET /posts/search`

Full search results for one term. A page of the reports whose **tracking code**,
**title** or **address** contains the term, case-insensitively, newest first.

It is the long form of the search box: `GET /posts/suggestions` is the six-item
dropdown, this is what the "Search" button opens. Same query, same fields, a
paginated result set instead of a shortlist.

**Auth: optional.** A signed-out request works. A token fills in `likedByMe` on
each result, exactly like [`GET /posts`](list-reports.md).

## What it matches

```
/posts/search?search=finch
```

- `trackingCode` contains the term — `OCV-2026-000123` matches `000123`
- `title` contains the term
- `address` contains the term

Contains, anywhere in the field, and case-insensitive: `finch` matches
`400 Finch Ave W`. A term that matches nothing returns an empty `posts` array, not
an error.

### Only those three fields

This is deliberately **narrower** than the `search` parameter on
[`GET /posts`](list-reports.md), which also reads the description and the city. A
dedicated search matches the things a person has in front of them — the code they
were given, the title, the address — and nothing that happens to mention the word
buried in a paragraph. If you want the wider match, use `GET /posts?search=`.

Category, ward, status and priority are **not** parameters here. To narrow a
search, use the filters on [`GET /posts`](list-reports.md) instead.

The numeric `id` is not matched either, only the `trackingCode`. Sequential ids are
deliberately not public identifiers — the tracking code is what a report is quoted
by — so searching `"30"` does not surface report 30 unless its code or text
contains it.

### The term is required, and at least two characters

Unlike a filter, a blank query is not "no opinion" here — a search for nothing is a
mistake, so it is a `400`. The floor is two characters: a single letter matches
almost every report and cannot be ranked, so it is rejected rather than run as a
full scan.

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `search` | — | **required.** free text, trimmed, 2–120 chars |
| `page` | `1` | positive integer |
| `limit` | `12` | positive integer, max `100` |

## Response — `200`

The same envelope as [`GET /posts`](list-reports.md):

```json
{
  "posts": [ /* Report[] */ ],
  "total": 4,
  "page": 1,
  "limit": 12,
  "pageCount": 1
}
```

Each element is a [`Report`](../objects.md#report). Ordering is `createdAt`
descending with an `id` tiebreak — newest first — so pagination is stable. It is
not a relevance order; ranked shortlists are what
[`GET /posts/suggestions`](suggest-reports.md) is for.

## Status codes

| Status | When |
| --- | --- |
| `200` | always, including no matches (empty `posts`, real `total`) |
| `400` | `search` missing, under 2 characters or over 120; or `page`/`limit` invalid. `details.search` carries the message |

## Why a separate endpoint

`GET /posts?search=` already searches. The split is about intent, not capability:
the feed endpoint filters an already-loaded page in place, while this one is what a
search box submits. Keeping it separate lets the field set, the required term and
the minimum length be a search's rules without changing the feed's, and gives the
search UI one call with no filter parameters to assemble.

## Costs

Constant number of SQL statements per request regardless of `limit`: the page
query and a count, plus one batched like lookup when signed in. No N+1.

The match is a case-insensitive `contains` across three columns, which is a
sequential scan. Fine at this size; it wants a trigram index (`pg_trgm`) before the
table gets large — see [not-implemented.md](../not-implemented.md#scaling).

## See also

- [`GET /posts/suggestions`](suggest-reports.md) — the six best matches for a dropdown
- [`GET /posts`](list-reports.md) — the feed, and its wider `search` plus all the filters
- [`GET /posts/:code`](get-report.md) — one report, once a result is chosen
