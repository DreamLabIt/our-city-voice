# `GET /posts/:code/comments`

A page of comment threads on one report.

**Auth: optional.** A token fills in `likedByMe` on both comments and replies.

`:code` resolves exactly as it does on [`GET /posts/:code`](get-report.md),
including the `400` for a malformed code and the `404` for an unknown one. A wrong
code gets a `404` rather than an empty list — "no comments yet" is a misleading
answer to a URL that was wrong.

Reading comments does **not** count a view.

## Query parameters

| Param | Default | Accepts |
| --- | --- | --- |
| `page` | `1` | positive integer |
| `limit` | `20` | positive integer, max `100` |

Blank values mean "no opinion" here too, so `?page=&limit=` is a valid request for
page 1.

## Response — `200`

```json
{
  "comments": [
    {
      "id": "1",
      "postId": "30",
      "message": "Hit this on Saturday night and bent a rim.",
      "likeCount": 14,
      "likedByMe": false,
      "author": {
        "id": "1", "name": "Platform Admin", "avatarUrl": null,
        "role": "super_admin", "departmentId": null
      },
      "createdAt": "2026-10-07T07:37:05.125Z",
      "updatedAt": "2026-10-07T07:37:05.125Z",
      "replies": [
        { "id": "4", "postId": "30", "message": "Keep the repair invoice...",
          "likeCount": 5, "likedByMe": true,
          "author": { "id": "2", "name": "Platform User", "avatarUrl": null,
                      "role": "user", "departmentId": null },
          "createdAt": "...", "updatedAt": "..." }
      ]
    }
  ],
  "total": 3,
  "page": 1,
  "limit": 20,
  "pageCount": 1
}
```

Oldest first, which is how a conversation reads. Field reference:
[`Comment` and `CommentThread`](../objects.md#comment-and-commentthread).

## Four things to know

**1. `total` counts top-level comments only** — that is what the pages are over.
The all-in number including replies is `post.counts.comments` on the report itself.
For the example above, `total` is `3` and `counts.comments` is `5`.

**2. Replies are never paginated.** Every reply to a thread on the current page
arrives in full. Nesting is capped at one level and threads are a handful of
messages long, so a "show more" inside each thread would be ceremony. A reply has
no `replies` key, so three-deep threads are unrepresentable rather than merely
discouraged.

**3. Soft-deleted comments are absent,** both top-level ones and replies, and they
do not count toward `total`.

**4. `role` is the account role, not a display label.** Deriving `isOfficial` and
the other mock fields is covered in
[objects.md](../objects.md#role-is-the-account-role-not-a-display-label).

## Status codes

| Status | When |
| --- | --- |
| `200` | always, including a report with no comments (`total: 0`) and a page past the end |
| `400` | `:code` is not a plausible tracking code or id, or an invalid `page`/`limit` |
| `404` | no such report |

## Costs

9 SQL statements signed in, 8 signed out — constant whether the page holds one
thread or twenty. Replies and comment likes are each one batched query, not one per
parent.
