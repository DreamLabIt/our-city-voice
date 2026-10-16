# `PATCH /posts/:code/status`

Moves a report along its workflow: `pending`, `in_progress`, `resolved`,
`rejected`. This is the write that appends to the status timeline.

**Auth: required, super admin only.** Status is the officer workflow, not something
an author controls — a signed-in non-admin gets a `403`, and their
[`PATCH /posts/:code`](update-report.md) cannot change status either. A signed-out
request gets a `401`.

## Why it is not a field on `PATCH /posts/:code`

An edit changes what a report says; a status change records that it moved and when.
The timeline is append-only and is what makes "average time to resolution"
answerable, so the two are separate writes. `status` stays absent from the edit
schema on purpose; see [update-report.md](update-report.md#what-an-edit-cannot-change).

## Request body

JSON, validated strictly — an unknown key is a `400`.

```jsonc
{
  "status": "resolved",                       // required, pending|in_progress|resolved|rejected
  "note": "Pothole filled and the road resealed."  // optional, ≤1000 chars, blank → null
}
```

`note` is trimmed and stored as `null` when it is blank or omitted.

## What the server does

In one transaction:

1. Updates `posts.status`, and sets `posts.resolvedAt` to now when the new status
   is `resolved`, or clears it (`null`) for any other status. The column tracks the
   resolved status alone, so moving out of `resolved` unpins it.
2. Inserts one `post_status_history` row: `actorId` is the super admin, `fromStatus`
   is the previous value, `toStatus` is the new one, and `title` is
   `Status changed to <status>` (`in_progress` renders as "in progress").

Nothing is touched: `priority`, `departmentId`, `assignedOfficerId` and the fields
[`PATCH /posts/:code`](update-report.md) owns all stay as they were.

`resolvedAt` in the response reflects step 1.

### Setting the status it already has is a no-op

Send the value a report already carries and the server returns `200` with the
report unchanged and writes **no timeline entry**. A status form that re-sends the
current value does not fill the timeline with duplicates. A `note` sent with a
same-value status is ignored as part of that no-op.

## Response — `200`

```json
{
  "post": { /* Report */ }
}
```

The full updated [`Report`](../objects.md#report), so the dashboard can replace its
row from the response. `status` and `resolvedAt` are the changed fields;
`likedByMe` reflects the caller.

The response is a `Report`, not a `ReportDetail`, so it does **not** carry the new
timeline entry. Fetch [`GET /posts/:code`](get-report.md) to render the timeline,
where the new row appears last, actor included.

## Status codes

| Status | When |
| --- | --- |
| `200` | changed, or already at the requested status |
| `400` | `status` missing or not one of the four values, an unknown key, a `note` over 1000 chars, or a malformed `:code`. `details` is field → messages |
| `401` | no/expired token |
| `403` | signed in, but not a super admin |
| `404` | no such report, or it was moderated away |

A soft-deleted report is a `404` for everyone, a super admin included, until it is
restored — and there is no restore endpoint yet.

## Cost

One read to resolve the report, then a transaction: the `UPDATE` and the history
insert. One more read when the status is unchanged (to return the row).

## See also

- [`GET /posts/:code`](get-report.md) — read the updated timeline
- [`PATCH /posts/:code`](update-report.md) — edit the report's content, not its status
- [`DELETE /posts/:code`](delete-report.md) — remove it instead
