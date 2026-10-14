# `DELETE /posts/:code/like`

Removes the caller's like from a report, if it is there, and returns the new
count.

**Auth: required.**

## Idempotent the other way

Unliking something that was never liked is a `200` with the count unchanged, not a
`404`. The client's intent is "make sure my like is gone", so repeating the call
is harmless — the same reasoning as
[`POST …/like`](like-report.md#idempotent-by-design). Only a row that actually
existed decrements `posts.like_count`, so a no-op cannot drag the count down.

## Request

No body.

## Response — `200`

```json
{ "likedByMe": false, "likeCount": 14 }
```

## Status codes

| Status | When |
| --- | --- |
| `200` | removed, or already absent |
| `400` | the `:code` is malformed |
| `401` | no/expired token |
| `404` | no such report, or it was soft-deleted |

## Cost

One read to resolve and authorise the report, then one delete and one counter
`UPDATE` in a single transaction.

## See also

- [`POST /posts/:code/like`](like-report.md) — add the like
- [`DELETE /posts/:code/comments/:commentId/like`](unlike-comment.md) — the same for a comment
</content>
