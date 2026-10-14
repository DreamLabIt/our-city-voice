# `POST /posts/:code/comments/:commentId/like`

Records the caller's like on a comment or a reply, and returns the new count.

**Auth: required.**

`commentId` is a numeric comment id, the same value used by
[`replies`](reply-to-comment.md). A reply can be liked as well as a top-level
comment — the frontend shows the same button on both.

## Idempotent, like the report pair

The mechanics and the reasoning are the same as
[`POST /posts/:code/like`](like-report.md#idempotent-by-design): a unique
`(comment_id, user_id)` index plus `ON CONFLICT DO NOTHING` means a repeat moves
`comments.like_count` once, never twice. To remove a like, call
[`DELETE …/like`](unlike-comment.md); there is no toggle.

## Request

No body.

## Response — `200`

```json
{ "likedByMe": true, "likeCount": 15 }
```

## Status codes

| Status | When |
| --- | --- |
| `200` | recorded (including a repeat) |
| `400` | a malformed `:code` or `commentId` |
| `401` | no/expired token |
| `404` | no such report, or no such comment on this report |

## Cost

One read to resolve the report, one to fetch the comment, then one insert and one
counter `UPDATE` in a single transaction.

## See also

- [`DELETE /posts/:code/comments/:commentId/like`](unlike-comment.md) — remove it
- [`POST /posts/:code/like`](like-report.md) — the same for the report itself
- [`GET /posts/:code/comments`](list-report-comments.md) — `likedByMe` per comment
</content>
