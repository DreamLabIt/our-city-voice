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

// The media carousel already has what it needs. No merging image into gallery the
// way the mock version does, because gallery already contains it.
const items = post.media.gallery;
```

`post.updates` becomes `post.timeline`, with `update.date` → `entry.createdAt` and
`update.actor` → `entry.actor?.name`. Handle `actor: null`: automated steps have
none, and neither does the author's own entry on an anonymous report. The rest of
the mapping is in [reports-page.md](reports-page.md#how-each-mock-field-maps).

## The buttons do not work yet

Like, reply and comment are still reads away from being writes — only
[`POST /posts`](../endpoints/create-report.md) accepts a `POST` today, and these
controls are not it. So they can only update local state, which is what
`IssueDetails.tsx` already does. See
[not-implemented.md](../not-implemented.md).
