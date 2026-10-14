# `POST /posts/:code/comments/:commentId/replies`

Answers an existing comment. The reply joins the parent's thread, one level deep.

**Auth: required.** Like a comment, a reply is owned by the account that wrote it.

`commentId` is a numeric comment id — the `id` on a row from
[`GET /posts/:code/comments`](list-report-comments.md). It is **not** a tracking
code: a comment has no public handle. A non-numeric `commentId` is a `400` before
any query runs.

## The parent must be a top-level comment

Nesting is capped at one level:

- the parent must exist **on this report** — a comment id from another report is a
  `404`, not a silent cross-post
- the parent must not be soft-deleted — a `404`, the same answer a read gives
- the parent must itself be top-level. Replying to a reply is a `400`:
  `"Replies go one level deep. Reply to the original comment instead."`

That last rule is why a reply has no `replies` key of its own in the read shape —
see [objects.md](../objects.md#comment-and-commentthread). The frontend offers
"Reply" only on top-level comments, so this is a guardrail rather than a normal
path.

## Request body

```jsonc
{
  "message": "Keep the repair invoice — the city may cover it."   // required, 1–2000 chars
}
```

Same shape and rules as [`POST /posts/:code/comments`](create-comment.md#request-body).

## Response — `201`

```json
{
  "comment": { /* Comment — the reply, no replies key, no parentId */ }
}
```

A reply is a plain [`Comment`](../objects.md#comment-and-commentthread): append it
to `parent.replies`. The response does not carry `parentId`; you already know the
parent from the request.

Creating a reply increments `post.commentCount` in the same transaction — the
all-in number counts replies too.

## Status codes

| Status | When |
| --- | --- |
| `201` | created |
| `400` | validation failed, a malformed `:code`/`commentId`, or the parent is itself a reply |
| `401` | no/expired token |
| `404` | no such report, or no such comment on this report |

## Cost

One read to resolve the report, one to fetch and check the parent, then the reply
insert and counter `UPDATE` in a single transaction.

## See also

- [`POST /posts/:code/comments`](create-comment.md) — a top-level comment instead
- [`GET /posts/:code/comments`](list-report-comments.md) — read the thread back
- [`POST /posts/:code/comments/:commentId/like`](like-comment.md) — like the parent or reply
</content>
