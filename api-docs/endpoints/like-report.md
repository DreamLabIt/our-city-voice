# `POST /posts/:code/like`

Records the caller's like on a report and returns the new count.

**Auth: required.** A like belongs to an account; there is no anonymous like.

`:code` resolves exactly as it does on [`GET /posts/:code`](get-report.md): a
tracking code or a numeric id, `400` for a malformed one, `404` for an unknown
one. A soft-deleted report is a `404`.

## Idempotent by design

Liking is not a toggle that flips state — it means "make sure my like is there".
Calling it again leaves the count at +1, not +2:

| Call | Before | After |
| --- | --- | --- |
| `POST …/like` | not liked | liked, count +1 |
| `POST …/like` again | liked | liked, count unchanged |

Two tabs double-tapping, or a retry after a timeout, therefore cannot inflate a
count. The database enforces it: `post_likes` has a unique `(post_id, user_id)`
index, and the insert runs with `ON CONFLICT DO NOTHING`, so only a genuinely new
row moves `posts.like_count`.

To remove a like, call [`DELETE /posts/:code/like`](unlike-report.md) — there is no
toggle.

## Request

No body. Not sending a `Content-Type` is normal.

## Response — `200`

```json
{ "likedByMe": true, "likeCount": 15 }
```

`likedByMe` is always `true` here, and `likeCount` is the updated public total.
This is deliberately **not** the whole [`Report`](../objects.md#report): a like
button should update one number, not re-render a card.

## Status codes

| Status | When |
| --- | --- |
| `200` | recorded (including a repeat with nothing to change) |
| `400` | the `:code` is malformed |
| `401` | no/expired token |
| `404` | no such report, or it was soft-deleted |

## Cost

One read to resolve and authorise the report, then one insert and one counter
`UPDATE` in a single transaction.

## See also

- [`DELETE /posts/:code/like`](unlike-report.md) — remove the like
- [`GET /posts/:code`](get-report.md) — `likedByMe` and `likeCount` on the report
- [`POST /posts/:code/comments/:commentId/like`](like-comment.md) — the same for a comment
</content>
