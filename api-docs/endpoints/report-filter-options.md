# `GET /posts/filters`

The option lists for the filter dropdowns on the reports page.

**Auth: none.** No parameters.

## Why this is a separate call

The options are a property of the whole table, and a paginated list only knows
about the rows it returned. Build the dropdown from those and "Roads" vanishes
from the menu the moment you are on a page with no road reports.

## Response — `200`

```json
{
  "categories": [
    { "id": "1", "name": "Roads", "value": "roads", "icon": "Road", "postCount": 9 },
    { "id": "5", "name": "Parks", "value": "parks", "icon": "Trees", "postCount": 0 }
  ],
  "wards": [
    { "id": "2", "name": "Ward 22 (Scarborough Agincourt)", "value": "ward-22", "postCount": 8 }
  ],
  "statuses":   [ { "value": "pending",  "postCount": 9 } ],
  "priorities": [ { "value": "critical", "postCount": 8 } ]
}
```

Field reference: [`FilterOptions`](../objects.md#filteroptions).

`value` is what you send back as `?category=` or `?ward=` on
[`GET /posts`](list-reports.md); `name` is what you show.

## Three things to know

**Every category and ward is listed, including ones with no reports,** and
`postCount` says which. A dropdown that hides empty options cannot be used to find
out that a ward has filed nothing.

**`postCount` is not faceted.** It counts all visible reports, not the current
filter selection, so the numbers do not shrink as somebody narrows. True faceted
counts would mean re-running the filtered query once per option, which is a
different and much more expensive feature.

**Soft-deleted reports are excluded from the counts,** matching what
`GET /posts` shows by default.

## Caching

Safe to cache for a few minutes. It changes only when a category or ward is added,
and nothing in the API can do that yet — see
[not-implemented.md](../not-implemented.md).

Six queries, constant.
