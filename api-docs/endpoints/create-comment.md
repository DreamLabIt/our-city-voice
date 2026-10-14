# `POST /posts/:code/comments`

Adds a top-level comment to a report's discussion.

**Auth: required.** A comment is always attached to an account: `comments.user_id`
is `NOT NULL`, and the authorising account *is* the author. There is no
signed-out comment and no anonymous comment — `isAnonymous` is a property of a
report, not of a reply.

`:code` resolves as on [`GET /posts/:code`](get-report.md). A soft-deleted report
is a `404`, so a comment cannot revive a moderated-away thread.

## Request body

JSON, validated strictly — an unknown key is a `400`, not silent.

```jsonc
{
  "message": "Hit this on Saturday night and bent a rim."   // required, 1–2000 chars
}
```

`message` is trimmed first, so a body of only spaces is a `400`, not an empty
comment.

## Response — `201`

```json
{
  "comment": { /* Comment — no replies key */ }
}
```

The created [`Comment`](../objects.md#comment-and-commentthread), ready to append
to the list. Its `likeCount` is `0` and `likedByMe` is `false` — you just wrote it.

## What the server sets

`postId` comes from `:code`, `userId` from the token, `parentId` is `null` (a
top-level comment), and `createdAt`/`updatedAt` are the insert time. None of these
is accepted from the client.

Creating a comment increments `post.commentCount` in the same transaction.

## Replies

For a reply, use
[`POST /posts/:code/comments/:commentId/replies`](reply-to-comment.md). Nesting is
capped at one level; replying to a reply is a `400` there.

## Status codes

| Status | When |
| --- | --- |
| `201` | created |
| `400` | validation failed, an unknown key, or a malformed `:code` |
| `401` | no/expired token |
| `404` | no such report, or it was soft-deleted |

`details` lands each message under the field it belongs to, so `details.message`
goes next to the textarea — envelope in [errors.md](../errors.md).

## Cost

One read to resolve the report, then one comment insert and one counter `UPDATE`
in a single transaction.

## See also

- [`GET /posts/:code/comments`](list-report-comments.md) — read the thread back
- [`POST /posts/:code/comments/:commentId/replies`](reply-to-comment.md) — answer a comment
- [`POST /posts/:code/comments/:commentId/like`](like-comment.md) — like a comment
</content>
