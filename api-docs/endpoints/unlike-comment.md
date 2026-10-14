# `DELETE /posts/:code/comments/:commentId/like`

Removes the caller's like from a comment or reply, if it is there, and returns the
new count.

**Auth: required.**

Idempotent: unliking a comment that was never liked is a `200` with the count
unchanged, not a `404`. Same reasoning as
[`DELETE /posts/:code/like`](unlike-report.md#idempotent-the-other-way).

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
| `400` | a malformed `:code` or `commentId` |
| `401` | no/expired token |
| `404` | no such report, or no such comment on this report |

## See also

- [`POST /posts/:code/comments/:commentId/like`](like-comment.md) — add the like
- [`DELETE /posts/:code/like`](unlike-report.md) — the same for the report
</content>
