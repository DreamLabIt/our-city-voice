# Wiring up the reports page

`app/reports/page.tsx` with [`GET /posts`](../endpoints/list-reports.md) and
[`GET /posts/filters`](../endpoints/report-filter-options.md).

Today it holds `posts` from `data/mock-data.ts` in state and filters in a
`useMemo`. The move is to let the URL hold the filter state and let the server do
the filtering, which is also what makes the ward deep link (`/reports?ward=...`)
and the browser back button work.

## A sensible page URL

```
/reports?search=pothole&category=roads&status=pending&ward=ward-22&page=2
```

Those names are exactly the API's, so the page can forward its own `searchParams`
almost verbatim.

## Where to fetch from

- **Through the Next server** (recommended). `likedByMe` and `mine` need the access
  token, which lives in an httpOnly cookie the browser cannot read, so anything
  involving the signed-in reader has to go this way. One code path.
- **Straight from the browser** using `NEXT_PUBLIC_API_URL`. CORS already allows
  `http://localhost:3000` and the feed is public, but `likedByMe` is always `false`
  and `mine` is unavailable, so it only suits a signed-out view.

## The page

```ts
import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

/** The response envelope. Worth adding to types/index.ts alongside PostItem. */
interface ReportListResponse {
  posts: Report[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  // The page's parameter names are the API's, so this forwards rather than
  // translates. Blank values are safe to pass straight through.
  const query = new URLSearchParams();
  for (const key of ["search", "category", "ward", "status", "priority", "sort", "page"]) {
    const value = params[key];
    if (typeof value === "string") query.set(key, value);
  }

  const token = await getAccessToken();

  // Both at once: the feed does not have to wait for the dropdown options.
  const [feed, filters] = await Promise.all([
    apiFetch<ReportListResponse>(`/posts?${query}`, { token }),
    apiFetch<FilterOptions>("/posts/filters"),
  ]);

  if (!feed.ok) {
    // A 400 here means a filter value in the URL is not valid — somebody edited
    // it by hand, or a stale link. Showing the empty state beats an error page.
    return <EmptyState message={feed.error.message} />;
  }

  return <ReportsList data={feed.data} options={filters.ok ? filters.data : null} />;
}
```

`token` is passed even though the endpoint is public: it is what turns on
`likedByMe`, and `apiFetch` omits the header when there is no session.

## The dropdowns

Build them from `/posts/filters`, not from the posts on the current page — a page
with no road reports would otherwise drop "Roads" out of the menu. Send
`option.value` back as the filter, show `option.name`.

`ReportFilters.tsx` currently takes `categories`, `statuses` and `wards` as
`string[]` built from the mock data, with `"All"` prepended. Those become the
option objects, and `"All"` becomes "no `category` parameter at all" rather than a
value you send.

## For the citizen dashboard

Same endpoint, one parameter:

```ts
await apiFetch<ReportListResponse>("/posts?mine=true&sort=newest&limit=10", { token });
```

## How each mock field maps

`PostItem` in `types/index.ts` is a mock shape, and some of it is presentation
rather than data. These have no API equivalent **by design**:

| `PostItem` field | Where it comes from now |
| --- | --- |
| `code` | `trackingCode` |
| `desc` | `description` |
| `tag` | `category.name` |
| `location` | `location.address` |
| `comments`, `likes`, `views` | `counts.comments`, `counts.likes`, `counts.views` |
| `tagBg`, `tagText` | Tailwind class names. Derive from `category.slug` in the frontend; the API has no business shipping CSS |
| `date` | `createdAt` (ISO). Format it where it is rendered |
| `updatedAt: "2 hours ago"` | `updatedAt` is ISO; make the relative string on the client |
| `reporterInitials` | Derive from `author.name`. Remember `author` is `null` when anonymous |
| `status`, `priority` | Same names, but `in_progress` not `"In Progress"` — see [conventions.md](../conventions.md#enums-are-not-display-strings) |
| `category: "Latest" \| "Most Commented" \| ...` | Not a category — it is a feed tab. Use `sort` |
| `details[]` | There is one `description` column, not an array. Split it: `description.split(/\n{2,}/)` |
| `gallery[]` | `media.gallery`, on [`GET /posts/:code`](../endpoints/get-report.md) |
| `updates[]` | `timeline`, on [`GET /posts/:code`](../endpoints/get-report.md) |

## Do not call the detail endpoint per card

It counts a view every time. `GET /posts` already carries everything a card needs.
