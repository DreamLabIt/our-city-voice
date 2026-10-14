# `GET /posts/suggestions`

The six best matches for a term, for a search box's dropdown. Each is a small
candidate object — enough to render a row and link to the report — not a full
[`Report`](../objects.md#report). Meant to be called as somebody types.

**Auth: none.** The candidates carry no per-reader field, so a token is neither
needed nor read.

## What it matches

The same three fields as [`GET /posts/search`](search-reports.md), by the same
case-insensitive contains: `trackingCode`, `title` and `address`.

```
/posts/suggestions?search=finch
```

## The term is required, and at least two characters

A blank query is a `400`, and so is a single character — a dropdown that fires on
every keystroke should not run a full scan for `"a"`. Start calling at two
characters.

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `search` | — | **required.** free text, trimmed, 2–120 chars |

## Response — `200`

```json
{
  "suggestions": [ /* ReportSuggestion[] — at most 6 */ ]
}
```

At most six, most relevant first. An empty array when nothing matches — a dropdown
with no rows, not an error. See [`ReportSuggestion`](../objects.md#reportsuggestion)
for the shape.

### How "most relevant" is decided

Each match is scored, then the top six are kept:

| Match | Score |
| --- | --- |
| `trackingCode` equals the term | 100 |
| `trackingCode` starts with the term | 50 |
| `trackingCode` contains the term | 25 |
| `title` starts with the term | 20 |
| `title` contains the term | 10 |
| `address` starts with the term | 8 |
| `address` contains the term | 4 |

A row's score is the sum of the highest hit per field, so a term that is both in
the code and the title outranks one that is only in the title. Ties fall back to
newest first.

Practically: typing a full tracking code puts that report first; typing the start
of a street name puts the reports on it above a report that merely mentions it.

### A bounded candidate set

Ranking runs in the application, over the **50 most recent** matches, so a term
matching thousands of reports still returns quickly and predictably. A very old
report outside that window does not appear in the dropdown — it is still reachable
through [`GET /posts/search`](search-reports.md), which has no such cap.

## Status codes

| Status | When |
| --- | --- |
| `200` | always, including no matches (empty `suggestions`) |
| `400` | `search` missing, under 2 characters or over 120. `details.search` carries the message |

## When to call it

Debounce. Fire on a pause in typing (a few hundred milliseconds) against the
**latest** term only, and discard a response whose term is no longer current — the
matches are ranked, so an out-of-order reply can show the wrong six. `search` is
trimmed server-side, so `" finch "` and `"finch"` are the same query.

A suggestion links to `/issues/<trackingCode>`; the code is already in the object,
so the click needs no second request.

## Costs

One query, capped at 50 rows, plus the in-memory ranking. No count, no pagination,
no like lookup.

## See also

- [`GET /posts/search`](search-reports.md) — the full, paginated results for the same term
- [`ReportSuggestion`](../objects.md#reportsuggestion) — the candidate shape
- [`GET /posts`](list-reports.md) — when a search box sits next to filters
