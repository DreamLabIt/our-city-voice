# Not implemented

Called out so nothing in these docs is mistaken for an oversight.

**The short version: every read the current pages need exists, and no write does.**

## Writes

**One write now exists:** creating a report via
[`POST /posts`](endpoints/create-report.md). Everything else below still has no
`POST`, `PUT` or `DELETE`:

- **Liking a report**, and **unliking one**. `likedByMe` can be read, not set.
- **Posting a comment or a reply**, and **liking a comment**. The controls in
  `IssueDetails.tsx` can only update local state.
- **Changing a status.** Which also means nothing writes to the timeline that
  [`GET /posts/:code`](endpoints/get-report.md) reads.
- **Soft-deleting a report or a comment.** Both are readable with a super admin
  token and neither is settable.
- **Changing a password.** `PATCH /me` will not set a new one; it needs its own
  endpoint, because a new password has a minimum length that *confirming* an
  existing one must not be held to, and changing it should end every other session.
- **Creating a category or a ward.** `/posts/filters` reads them; only the seed
  writes them.
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
- **No contact-message endpoint,** though the table exists.

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

- **`search` does not scale.** A case-insensitive `contains` across five columns is
  a sequential scan. It wants a trigram index (`pg_trgm`) or a `tsvector` column
  before the table gets large.
- **Pagination is offset-based.** Fine for numbered pages; a report filed mid-scroll
  shifts rows by one. The index for a keyset cursor already exists
  (`posts(created_at DESC, id DESC)`).
- **Reads cost a constant but chunky number of queries.** A detail page is 17
  statements, 19 signed in, constant regardless of how many gallery items, timeline
  entries or related reports come back. Prisma issues one query per relation by
  default; its `relationJoins` preview feature collapses them into joins if this
  ever matters.
- **Rate limits are per process and in memory.** Two API containers each allow the
  full quota, and a restart forgets everything. A real limit across replicas needs
  Redis, and there is no Redis in the stack.
