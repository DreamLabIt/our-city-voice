# OurCityVoice API

Reference for the frontend. Everything documented here is live on `dev` and was
tested against the running stack; **none of it is wired up in the frontend yet**,
which is what these files are for.

## Endpoints

One file each. The method and path at the top of a file is the contract; the rest
is why it behaves the way it does.

| Endpoint | Auth | What it is |
| --- | --- | --- |
| [`GET /me`](endpoints/get-current-user.md) | required | the signed-in account |
| [`PATCH /me`](endpoints/update-current-user.md) | required | change your own name, email, phone or avatar |
| [`GET /posts`](endpoints/list-reports.md) | optional | the filtered, paginated feed of reports |
| [`POST /posts`](endpoints/create-report.md) | required | file a new report |
| [`GET /posts/filters`](endpoints/report-filter-options.md) | none | option lists for the filter dropdowns |
| [`GET /posts/search`](endpoints/search-reports.md) | optional | full results for a term, by code, title or address |
| [`GET /posts/suggestions`](endpoints/suggest-reports.md) | none | up to six best matches for a search box |
| [`GET /posts/:code`](endpoints/get-report.md) | optional | one report, with timeline and related |
| [`PATCH /posts/:code`](endpoints/update-report.md) | required | edit a report you filed (or any, as a super admin) |
| [`PATCH /posts/:code/status`](endpoints/update-report-status.md) | required | move a report's status (super admin only) |
| [`DELETE /posts/:code`](endpoints/delete-report.md) | required | soft-delete a report you filed (or any, as a super admin) |
| [`GET /posts/:code/comments`](endpoints/list-report-comments.md) | optional | a page of comment threads |
| [`POST /posts/:code/like`](endpoints/like-report.md) | required | like a report |
| [`DELETE /posts/:code/like`](endpoints/unlike-report.md) | required | remove your like from a report |
| [`POST /posts/:code/comments`](endpoints/create-comment.md) | required | add a top-level comment |
| [`POST /posts/:code/comments/:commentId/replies`](endpoints/reply-to-comment.md) | required | reply to a comment |
| [`POST /posts/:code/comments/:commentId/like`](endpoints/like-comment.md) | required | like a comment or reply |
| [`DELETE /posts/:code/comments/:commentId/like`](endpoints/unlike-comment.md) | required | remove your like from a comment |
| [`GET /contact/categories`](endpoints/list-contact-categories.md) | none | the contact form's category options |
| [`POST /contact/messages`](endpoints/create-contact-message.md) | none | store a contact-form submission |
| [`GET /contact/messages`](endpoints/list-contact-messages.md) | required | the contact inbox, paginated (super admin only) |

"Auth optional" means the endpoint answers a signed-out request and gives a
signed-in one more: `likedByMe`, and in some cases extra parameters.

## Read these first

| File | Why |
| --- | --- |
| [conventions.md](conventions.md) | how to call the API, and the rules every endpoint follows — ids, dates, enums, blank parameters, pagination |
| [objects.md](objects.md) | the shapes that come back: `User`, `Report`, `ReportDetail`, `Comment`, `FilterOptions` |
| [errors.md](errors.md) | one envelope for every failure, and how to put a message under the right input |

## Guides

Wiring a specific page up, with a worked example in the house style. None of this
code is written to disk.

| Guide | Covers |
| --- | --- |
| [guides/profile-form.md](guides/profile-form.md) | `app/dashboard/profile`, and the conditional password prompt |
| [guides/reports-page.md](guides/reports-page.md) | `app/reports`, plus how each mock `PostItem` field maps |
| [guides/report-detail-page.md](guides/report-detail-page.md) | `app/issues/[id]`, and why it should become `[code]` |

## Known gaps

[not-implemented.md](not-implemented.md) lists what deliberately does not exist
yet, so nothing here is mistaken for an oversight. The short version: **every read
the current pages need exists, plus the writes that own a report — filing one,
editing it and soft-deleting it — a super admin's status change, the engagement
controls the detail page shows: liking a report, posting a comment, replying, and
liking a comment; and the contact form, which can submit a message and list it back
in the admin inbox.**
