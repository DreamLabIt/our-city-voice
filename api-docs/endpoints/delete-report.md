# `DELETE /posts/:code`

Removes a report from the public site. It is a **soft delete**: the row stays in
`posts` with `deleted_at` set, so the action is reversible and the discussion
attached to it survives.

**Auth: required.** Only the report's author, or a super admin, may delete it.

## Who can delete

The same rule as [`PATCH /posts/:code`](update-report.md#who-can-edit): the author,
or a super admin on any report, and `403` for anyone else. An anonymous report's
author can still delete their own report; `author` reading `null` does not change
who owns the row.

## What "soft" means

The row is kept and `deleted_at` is set to the moment of the request. From then on:

- the report is gone from [`GET /posts`](list-reports.md) — it is not counted, not
  listed, and not returned as `related` on another report
- [`GET /posts/:code`](get-report.md) is a `404` for everyone, exactly as if it
  never existed
- its comments and timeline rows are untouched, so an undo (or an audit) still has
  everything
- a super admin can still read it with
  [`GET /posts/:code?includeDeleted=true`](get-report.md), which is the one place a
  deleted report is visible

There is **no restore endpoint yet**, and no hard delete. If the action needs to be
reversible from the product side, that is the missing piece; the data to reverse it
is there. See [not-implemented.md](../not-implemented.md).

## Response — `204`

No body. The report is gone; there is nothing to render from it.

```
HTTP/1.1 204 No Content
```

## Status codes

| Status | When |
| --- | --- |
| `204` | deleted |
| `400` | the `:code` is malformed |
| `401` | no/expired token |
| `403` | signed in, but the report is not yours and you are not a super admin |
| `404` | no such report, or it was already deleted |

A delete is **not idempotent from the client's perspective**: deleting an
already-deleted report is a `404`, not a second `204`. A `404` therefore covers both
"never existed" and "already gone", which is the same answer a read gives and keeps
the client from having to tell the two apart.

## Cost

One read to find and authorise the row, one `UPDATE` to set `deleted_at`. Nothing is
deleted, so no cascading work.

## See also

- [`PATCH /posts/:code`](update-report.md) — edit a report instead of removing it
- [`GET /posts/:code`](get-report.md) — the `includeDeleted` super admin read
- [not-implemented.md](../not-implemented.md) — why there is no restore or hard delete yet
</content>
