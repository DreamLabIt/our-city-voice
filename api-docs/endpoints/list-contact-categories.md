# `GET /contact/categories`

The category options for the contact form's dropdown.

**Auth: none.** The list is public because the form is public — the person filling
it in has no account, so the options cannot come from an authenticated call.

## Why this exists

The dropdown on `app/contact` is currently a hardcoded list of four labels that
does **not** match the rows in `contact_categories`:

| Hardcoded on the page | Stored category |
| --- | --- |
| `General Inquiry` | `General Enquiry` |
| `Report Issue Support` | `Report a Problem` |
| `Partnership & Media` | `Partnership` |
| `Technical Bug` | *(no equivalent)* |
| — | `Feedback or Suggestion` |
| — | `Media & Press` |

Drive the `Select` from this endpoint instead of a literal list, and send the
option's `id` as `categoryId` on
[`POST /contact/messages`](create-contact-message.md). That removes the mismatch
and means a renamed category does not need a frontend release.

## Response — `200`

```json
{
  "categories": [
    { "id": "1", "name": "General Enquiry" },
    { "id": "2", "name": "Report a Problem" },
    { "id": "3", "name": "Feedback or Suggestion" },
    { "id": "4", "name": "Media & Press" },
    { "id": "5", "name": "Partnership" }
  ]
}
```

Ordered by the seeded `sort_order`, then by `name`. Both `id` and `name` are what
you need: show `name`, submit `id`.

## Status codes

| Status | When |
| --- | --- |
| `200` | always |

No pagination: the list is a handful of options, the same as the report filter
dropdowns.

## See also

- [`POST /contact/messages`](create-contact-message.md) — submit the form; `categoryId` comes from here
- [`ContactCategory`](../objects.md#contactcategory) — the shape
