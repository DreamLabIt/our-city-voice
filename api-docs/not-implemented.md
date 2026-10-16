# Not implemented

Called out so nothing in these docs is mistaken for an oversight.

**The short version: every read the current pages need exists, plus the writes
that concern a report's own existence — filing it, editing it, soft-deleting it and
a super admin moving its status — the engagement controls on the detail page:
liking a report, posting a comment, replying, and liking a comment; and the contact
form, which can submit a message and list it back in the admin inbox. Everything
else is still a read.**

## Writes

**A report can be created, edited and soft-deleted by its author** (or a super
admin): [`POST /posts`](endpoints/create-report.md),
[`PATCH /posts/:code`](endpoints/update-report.md) and
[`DELETE /posts/:code`](endpoints/delete-report.md). **A super admin can also move
a report's status** — [`PATCH /posts/:code/status`](endpoints/update-report-status.md),
the only write that fills the [`timeline`](objects.md#timeline). The detail page's
engagement controls are live too:

- **Liking a report**, and unliking it —
  [`POST`/`DELETE /posts/:code/like`](endpoints/like-report.md).
- **Posting a comment, replying, and liking a comment** —
  [`POST /posts/:code/comments`](endpoints/create-comment.md),
  [`POST /posts/:code/comments/:commentId/replies`](endpoints/reply-to-comment.md)
  and [`POST`/`DELETE /posts/:code/comments/:commentId/like`](endpoints/like-comment.md).
- **Submitting the contact form** —
  [`POST /contact/messages`](endpoints/create-contact-message.md), with its
  category options from [`GET /contact/categories`](endpoints/list-contact-categories.md).

Everything else below still has no `POST`, `PUT` or `DELETE`:

- **Restoring a soft-deleted report.** `DELETE /posts/:code` sets `deleted_at` and
  keeps the row, so the data to reverse it is there, but no endpoint clears it.
- **Deleting a comment.** A comment cannot be removed on its own — there is no
  self-delete and no moderation delete. It survives until the report it belongs to
  is soft-deleted, which hides the whole thread at once.
- **Changing a password.** `PATCH /me` will not set a new one; it needs its own
  endpoint, because a new password has a minimum length that *confirming* an
  existing one must not be held to, and changing it should end every other session.
- **Creating a category or a ward.** `/posts/filters` reads them; only the seed
  writes them.
- **Marking a contact message handled.** `contact_messages.handled_at` and
  `handled_by` exist and `handledAt` is in the
  [`ContactMessage`](objects.md#contactmessage) response, but no endpoint sets
  them — every row reads as unhandled. The admin inbox can display, never triage.
- **Deleting or archiving a contact message.** Like a comment, a message cannot be
  removed once stored.
- **Deleting an account.** A user row is referenced by posts, comments and likes,
  so it needs a decision about what happens to their reports first.

## Reads that do not exist

- **No `department` or `assignedOfficer` filter** on the report list. Both are on
  every report, but neither is a filter the reports page has today. Each is about
  a line.
- **No statistics endpoint.** `app/statistics` and `components/landing/CommunityActivity.tsx`
  still show fabricated numbers.
- **No map endpoint.** `app/issues-map` can be built from `GET /posts` —
  `location.latitude` and `location.longitude` are on every report, and null when
  the address could not be resolved to a point.
- **No filters on the contact inbox.** [`GET /contact/messages`](endpoints/list-contact-messages.md)
  paginates but cannot filter by category, search the text, or split handled from
  unhandled. Each is a query parameter away when the dashboard needs it.

## Behaviour to know about

- **Views are not deduplicated.** Every read of
  [`GET /posts/:code`](endpoints/get-report.md) counts one, so a refresh counts
  twice and a crawler counts once per crawl.
- **No admin override on anonymity.** `author` is `null` for a super admin too, in
  both the report and its timeline. Moderating an anonymous report needs a
  deliberate, separately audited path, not a query parameter on the public feed —
  otherwise the anonymity is decorative.
- **`postCount` on `/posts/filters` is not faceted.** It counts all visible
  reports, not the current selection.
- **`emailVerifiedAt` is decoration.** Nothing sets it and nothing checks it. An
  email change clears it, which will matter when verification exists and is a no-op
  until then.
- **No avatar cleanup.** Clearing `avatarUrl` forgets the URL; the image stays in
  Cloudinary. The `publicId` is never sent to or stored by the API, so nothing in
  our own data can delete it. This is the orphan problem from the upload work, and
  it is still open.

## Fields with no column

- **`location` and `bio` on a user.** `ProfileForm.tsx` has inputs for both.
  Adding them is a migration, not an endpoint change.
- **`details[]` on a report.** There is one `description`; split it on blank lines.
- **`CommenterRole`** — "Resident", "Field Inspector", "Municipal Officer", "Ward
  Councillor". Nothing records a person's relationship to a report. `role` is
  `user` or `super_admin`, and `departmentId` is the signal for whether a comment
  is official.

## Scaling

- **`search` does not scale.** A case-insensitive `contains` is a sequential scan:
  across five columns on [`GET /posts`](endpoints/list-reports.md), three on
  [`GET /posts/search`](endpoints/search-reports.md) and
  [`GET /posts/suggestions`](endpoints/suggest-reports.md). All of them want a
  trigram index (`pg_trgm`) or a `tsvector` column before the table gets large.
  Suggestions cap the scan at 50 rows, which bounds the cost, not the scan.
- **Pagination is offset-based.** Fine for numbered pages; a report filed mid-scroll
  shifts rows by one. The index for a keyset cursor already exists
  (`posts(created_at DESC, id DESC)`).
- **Reads cost a constant but chunky number of queries.** A detail page is 17
  statements, 19 signed in, constant regardless of how many media rows, timeline
  entries or related reports come back. Prisma issues one query per relation by
  default; its `relationJoins` preview feature collapses them into joins if this
  ever matters.
- **Rate limits are per process and in memory.** Two API containers each allow the
  full quota, and a restart forgets everything. A real limit across replicas needs
  Redis, and there is no Redis in the stack.
