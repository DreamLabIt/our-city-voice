# Wiring up the detail page

`app/issues/[id]/page.tsx` with [`GET /posts/:code`](../endpoints/get-report.md)
and [`GET /posts/:code/comments`](../endpoints/list-report-comments.md).

Today it looks up `posts.find(item => item.id === id)` from `data/mock-data.ts`,
filters `postComments` by `postId`, and builds `relatedPosts` itself. All three now
come from the API, and `related` arrives already built.

## Two changes worth making while you are in there

**Rename the route segment to `[code]`.** The folder is `[id]` and the mock ids are
`"1"`, `"2"`. The endpoint accepts both a tracking code and a numeric id, so
nothing breaks either way — but `/issues/OCV-2026-000123` does not advertise how
many reports exist, and `/issues/30` does. It is a one-line change to the folder
name and the `params` type.

**Drop `generateStaticParams`.** It currently prerenders a page per mock post. A
report's status, counts and timeline all change, and the view counter increments on
read, so this page wants to be dynamic.

## The page

```ts
import { notFound } from "next/navigation";

import { apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/session";

interface ReportDetailResponse {
  post: ReportDetail;
  related: Report[];
}

interface CommentsResponse {
  comments: CommentThread[];
  total: number;
  page: number;
  limit: number;
  pageCount: number;
}

export default async function IssuePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const token = await getAccessToken();

  // Two calls, fired together: neither depends on the other.
  const [detail, comments] = await Promise.all([
    apiFetch<ReportDetailResponse>(`/posts/${code}`, { token }),
    apiFetch<CommentsResponse>(`/posts/${code}/comments`, { token }),
  ]);

  // 404 means no such report, or it was moderated away — the same answer either
  // way, deliberately. A 400 means the code in the URL is malformed, which is
  // also a page that does not exist as far as a visitor is concerned.
  if (!detail.ok) {
    if (detail.status === 404 || detail.status === 400) notFound();
    throw new Error(detail.error.message);
  }

  return (
    <IssueDetails
      post={detail.data.post}
      related={detail.data.related}
      // A failed comment fetch should not take the page down with it: the report
      // is the point, the discussion is not.
      comments={comments.ok ? comments.data.comments : []}
    />
  );
}
```

`generateMetadata` can make the same detail call — `apiFetch` sets
`cache: "no-store"`, so be aware that doing so counts a second view. Reading the
title off the first call in the page is cheaper if you can restructure for it.

## Two notes on the component

```ts
// details[] in the mock shape. One description column, blank lines between
// paragraphs, so the split happens where it is rendered.
const paragraphs = post.description.split(/\n{2,}/).filter(Boolean);

// `post.media` is already the full set of Media rows in sortOrder order, and it
// is the same list a card shows — no merging a gallery into a summary anywhere.
const items = post.media;
```

`post.updates` becomes `post.timeline`, with `update.date` → `entry.createdAt` and
`update.actor` → `entry.actor?.name`. Handle `actor: null`: automated steps have
none, and neither does the author's own entry on an anonymous report. The rest of
the mapping is in [reports-page.md](reports-page.md#how-each-mock-field-maps).

## Edit and delete

The report's own controls now have endpoints behind them. Show "Edit" and "Delete"
only to the author, or to a super admin — the API enforces the same rule, but hiding
the buttons saves a round trip. The author is `post.author` for a named report and
`null` for an anonymous one, so for an anonymous report compare against the
signed-in account from `GET /me` — the **author still owns an anonymous report** and
may edit or delete it even though `author` reads `null`.

- **Edit** — `PATCH /posts/:code` with only the changed fields, then replace local
  state from the returned `post`. See
  [`update-report.md`](../endpoints/update-report.md). An edit does not change the
  status, so the timeline does not move.
- **Delete** — `DELETE /posts/:code` returns `204` with no body; navigate away (to
  `/reports`, or back) rather than re-rendering. It is a soft delete, so a `404`
  afterwards is the expected "gone" answer. See
  [`delete-report.md`](../endpoints/delete-report.md).

`status`, `assignedOfficerId` and `departmentId` are not editable here — status is
the officer workflow, routing follows the category. An edit form built from the
create form should drop those fields from its body.

## Likes, comments and replies

The engagement controls now have endpoints behind them. Each returns exactly what
the control needs, so none of them requires a refetch.

- **Like a report** — `POST /posts/:code/like`, and `DELETE` to remove it. Both
  return `{ likedByMe, likeCount }`, which replaces those two fields in local
  state. Both are idempotent, so a double tap is safe. See
  [`like-report.md`](../endpoints/like-report.md).
- **Post a comment** — `POST /posts/:code/comments` with `{ message }` returns
  `201 { comment }`; prepend it to the list. See
  [`create-comment.md`](../endpoints/create-comment.md).
- **Reply** — `POST /posts/:code/comments/:commentId/replies` with `{ message }`
  returns `201 { comment }`, a plain `Comment` to append to `parent.replies`. The
  frontend already offers Reply only on top-level comments, which matches the
  one-level cap. See [`reply-to-comment.md`](../endpoints/reply-to-comment.md).
- **Like a comment** — `POST`/`DELETE /posts/:code/comments/:commentId/like`,
  returning the same `{ likedByMe, likeCount }` shape as the report pair. See
  [`like-comment.md`](../endpoints/like-comment.md).

Every one of these needs a token, so it runs through the Next server (a server
action), not from client JavaScript — see
[conventions.md](../conventions.md#how-the-frontend-calls-the-api). `comment.id` is
a BigInt-as-string; pass it through as-is, never parse it into a number.

The one control still without an endpoint is **deleting a comment**: there is no
self-delete and no moderation delete yet, so `IssueDetails.tsx` should not offer
one. See [not-implemented.md](../not-implemented.md).
