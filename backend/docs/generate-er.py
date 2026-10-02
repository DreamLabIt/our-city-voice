#!/usr/bin/env python3
"""
Generates backend/docs/database-er.txt as an Excalidraw clipboard payload.

Usage:  python3 backend/docs/generate-er.py
Then:   copy the file contents and paste into excalidraw.com (Ctrl+V).

The schema lives in SCHEMA below. Edit that, re-run, re-paste.
Keeping the source here means a schema change is a readable diff instead of
200KB of regenerated JSON.
"""

import json
import random
import os

random.seed(20261002)
NOW = 1790853669729

# ── layout constants ────────────────────────────────────────────────
BOX_W = 580
COL_GAP = 100
ROW_GAP = 90
HEADER_H = 46
FIELD_SIZE = 14
FIELD_LH = 1.25
FIELD_ROW = FIELD_SIZE * FIELD_LH          # 17.5
NOTE_SIZE = 12
NOTE_LH = 1.25
NOTE_ROW = NOTE_SIZE * NOTE_LH             # 15.0
PAD_X = 16
PAD_Y = 10
NOTE_SEP_H = 14

# field line format: "PK " + name(20) + type(13) + flags
F_KEY, F_NAME, F_TYPE = 4, 22, 13

PALETTE = {
    "auth":       "#fff3bf",
    "taxonomy":   "#d3f9d8",
    "content":    "#d0ebff",
    "engagement": "#e5dbff",
    "contact":    "#ffe3e3",
}

# ── schema ──────────────────────────────────────────────────────────
# (key, name, type, flags)  key is "PK" | "FK" | ""
SCHEMA = [
    dict(name="users", group="auth", col=0, fields=[
        ("PK", "id",                "bigserial",   ""),
        ("",   "name",              "text",        "NOT NULL"),
        ("",   "email",             "text",        "NOT NULL"),
        ("",   "password_hash",     "text",        "NOT NULL"),
        ("",   "phone",             "text",        ""),
        ("",   "role",              "text",        "NOT NULL"),
        ("FK", "department_id",     "bigint",      "-> departments.id"),
        ("",   "avatar_key",        "text",        ""),
        ("",   "email_verified_at", "timestamptz", ""),
        ("",   "created_at",        "timestamptz", "NOT NULL"),
        ("",   "updated_at",        "timestamptz", "NOT NULL"),
    ], notes=[
        "CHECK role IN ('citizen','officer','admin')",
        "UNIQUE INDEX on lower(email)  -- case-insensitive login",
        "department_id is set only for officers",
        "never return password_hash from any endpoint",
    ]),

    dict(name="refresh_tokens", group="auth", col=0, fields=[
        ("PK", "id",         "bigserial",   ""),
        ("FK", "user_id",    "bigint",      "-> users.id"),
        ("",   "token_hash", "text",        "UNIQUE NOT NULL"),
        ("",   "expires_at", "timestamptz", "NOT NULL"),
        ("",   "revoked_at", "timestamptz", ""),
        ("",   "user_agent", "text",        ""),
        ("",   "ip_address", "inet",        ""),
        ("",   "created_at", "timestamptz", "NOT NULL"),
    ], notes=[
        "store sha256(token), never the token itself",
        "revoked_at lets you log out one device",
        "INDEX (user_id, expires_at) / ON DELETE CASCADE",
    ]),

    dict(name="wards", group="taxonomy", col=0, fields=[
        ("PK", "id",          "bigserial",   ""),
        ("",   "name",        "text",        "NOT NULL"),
        ("",   "code",        "text",        "UNIQUE NOT NULL"),
        ("",   "description", "text",        ""),
        ("",   "created_at",  "timestamptz", "NOT NULL"),
        ("",   "updated_at",  "timestamptz", "NOT NULL"),
    ], notes=[
        "code is the public filter value, e.g. 'ward-4'",
    ]),

    dict(name="departments", group="taxonomy", col=0, fields=[
        ("PK", "id",          "bigserial",   ""),
        ("",   "name",        "text",        "UNIQUE NOT NULL"),
        ("",   "description", "text",        ""),
        ("",   "email",       "text",        ""),
        ("",   "phone",       "text",        ""),
        ("",   "created_at",  "timestamptz", "NOT NULL"),
        ("",   "updated_at",  "timestamptz", "NOT NULL"),
    ], notes=[
        "no SLA target column: SLA stats were dropped",
    ]),

    dict(name="posts", group="content", col=1, fields=[
        ("PK", "id",                  "bigserial",    ""),
        ("",   "tracking_code",       "text",         "UNIQUE NOT NULL"),
        ("",   "title",               "text",         "NOT NULL"),
        ("",   "description",         "text",         "NOT NULL"),
        ("FK", "user_id",             "bigint",       "-> users.id"),
        ("FK", "category_id",         "bigint",       "-> categories.id"),
        ("FK", "ward_id",             "bigint",       "-> wards.id"),
        ("FK", "department_id",       "bigint",       "-> departments.id"),
        ("FK", "assigned_officer_id", "bigint",       "-> users.id"),
        ("",   "status",              "text",         "NOT NULL"),
        ("",   "priority",            "text",         "NOT NULL"),
        ("",   "is_anonymous",        "boolean",      "NOT NULL"),
        ("",   "street",              "text",         ""),
        ("",   "city",                "text",         "NOT NULL"),
        ("",   "address",             "text",         "NOT NULL"),
        ("",   "postal_code",         "text",         ""),
        ("",   "latitude",            "numeric(9,6)", ""),
        ("",   "longitude",           "numeric(9,6)", ""),
        ("",   "view_count",          "integer",      "NOT NULL"),
        ("",   "like_count",          "integer",      "NOT NULL"),
        ("",   "comment_count",       "integer",      "NOT NULL"),
        ("",   "resolved_at",         "timestamptz",  ""),
        ("",   "deleted_at",          "timestamptz",  ""),
        ("",   "created_at",          "timestamptz",  "NOT NULL"),
        ("",   "updated_at",          "timestamptz",  "NOT NULL"),
    ], notes=[
        "CHECK status IN ('pending','in_progress','resolved','rejected')",
        "CHECK priority IN ('low','medium','high','critical')",
        "status + *_count are caches. post_status_history and the",
        "  like/comment rows are the source of truth",
        "lat/lng drive the Nearby and Map View tabs",
        "deleted_at = soft delete, so moderation is reversible",
        "INDEX (status, created_at DESC), (ward_id, status),",
        "      (category_id, status), (created_at DESC, id DESC)",
        "the last one is the keyset cursor for the feed",
    ]),

    dict(name="categories", group="taxonomy", col=2, fields=[
        ("PK", "id",                    "bigserial",   ""),
        ("",   "name",                  "text",        "NOT NULL"),
        ("",   "slug",                  "text",        "UNIQUE NOT NULL"),
        ("",   "description",           "text",        ""),
        ("",   "icon",                  "text",        "NOT NULL"),
        ("FK", "default_department_id", "bigint",      "-> departments.id"),
        ("",   "sort_order",            "integer",     "NOT NULL"),
        ("",   "created_at",            "timestamptz", "NOT NULL"),
        ("",   "updated_at",            "timestamptz", "NOT NULL"),
    ], notes=[
        "icon is a lucide icon name, not a CSS class",
        "a new report inherits default_department_id",
    ]),

    dict(name="post_status_history", group="content", col=2, fields=[
        ("PK", "id",          "bigserial",   ""),
        ("FK", "post_id",     "bigint",      "-> posts.id"),
        ("FK", "actor_id",    "bigint",      "-> users.id"),
        ("",   "from_status", "text",        ""),
        ("",   "to_status",   "text",        "NOT NULL"),
        ("",   "title",       "text",        "NOT NULL"),
        ("",   "note",        "text",        ""),
        ("",   "created_at",  "timestamptz", "NOT NULL"),
    ], notes=[
        "append only. never UPDATE, never DELETE",
        "from_status is NULL on the first row (report created)",
        "renders the issue detail timeline",
        "INDEX (post_id, created_at)",
    ]),

    dict(name="media", group="content", col=2, fields=[
        ("PK", "id",            "bigserial",   ""),
        ("FK", "post_id",       "bigint",      "-> posts.id"),
        ("",   "type",          "text",        "NOT NULL"),
        ("",   "storage_key",   "text",        "NOT NULL"),
        ("",   "thumbnail_key", "text",        ""),
        ("",   "mime_type",     "text",        "NOT NULL"),
        ("",   "size_bytes",    "bigint",      "NOT NULL"),
        ("",   "duration_secs", "integer",     ""),
        ("",   "sort_order",    "integer",     "NOT NULL"),
        ("",   "created_at",    "timestamptz", "NOT NULL"),
        ("",   "updated_at",    "timestamptz", "NOT NULL"),
    ], notes=[
        "CHECK type IN ('image','video')",
        "storage_key is a bucket key, NOT a URL.",
        "  build URLs at read time so you can move buckets",
        "duration_secs only applies to video",
        "ON DELETE CASCADE from posts",
    ]),

    dict(name="comments", group="engagement", col=3, fields=[
        ("PK", "id",         "bigserial",   ""),
        ("FK", "post_id",    "bigint",      "-> posts.id"),
        ("FK", "user_id",    "bigint",      "-> users.id"),
        ("FK", "parent_id",  "bigint",      "-> comments.id"),
        ("",   "message",    "text",        "NOT NULL"),
        ("",   "like_count", "integer",     "NOT NULL"),
        ("",   "deleted_at", "timestamptz", ""),
        ("",   "created_at", "timestamptz", "NOT NULL"),
        ("",   "updated_at", "timestamptz", "NOT NULL"),
    ], notes=[
        "parent_id NULL = top level. self-reference, one level",
        "  of nesting enforced in the service layer",
        "soft delete so replies survive a removed parent",
        "INDEX (post_id, created_at)",
    ]),

    dict(name="post_likes", group="engagement", col=3, fields=[
        ("PK", "id",         "bigserial",   ""),
        ("FK", "post_id",    "bigint",      "-> posts.id"),
        ("FK", "user_id",    "bigint",      "-> users.id"),
        ("",   "created_at", "timestamptz", "NOT NULL"),
    ], notes=[
        "UNIQUE (post_id, user_id)  <- this is the whole point",
        "without it one user can like the same post 50 times",
        "ON DELETE CASCADE on both FKs",
    ]),

    dict(name="comment_likes", group="engagement", col=3, fields=[
        ("PK", "id",         "bigserial",   ""),
        ("FK", "comment_id", "bigint",      "-> comments.id"),
        ("FK", "user_id",    "bigint",      "-> users.id"),
        ("",   "created_at", "timestamptz", "NOT NULL"),
    ], notes=[
        "UNIQUE (comment_id, user_id)",
    ]),

    dict(name="contact_messages", group="contact", col=4, fields=[
        ("PK", "id",          "bigserial",   ""),
        ("FK", "category_id", "bigint",      "-> contact_categories.id"),
        ("",   "name",        "text",        "NOT NULL"),
        ("",   "email",       "text",        "NOT NULL"),
        ("",   "phone",       "text",        ""),
        ("",   "subject",     "text",        "NOT NULL"),
        ("",   "message",     "text",        "NOT NULL"),
        ("",   "handled_at",  "timestamptz", ""),
        ("FK", "handled_by",  "bigint",      "-> users.id"),
        ("",   "created_at",  "timestamptz", "NOT NULL"),
        ("",   "updated_at",  "timestamptz", "NOT NULL"),
    ], notes=[
        "no user_id: senders do not need an account",
        "public write endpoint, so rate limit it",
    ]),

    dict(name="contact_categories", group="contact", col=4, fields=[
        ("PK", "id",         "bigserial",   ""),
        ("",   "name",       "text",        "UNIQUE NOT NULL"),
        ("",   "sort_order", "integer",     "NOT NULL"),
        ("",   "created_at", "timestamptz", "NOT NULL"),
        ("",   "updated_at", "timestamptz", "NOT NULL"),
    ], notes=[
        "populates the category select on /contact",
    ]),

    dict(name="site_contact_info", group="contact", col=4, fields=[
        ("PK", "id",            "integer",      ""),
        ("",   "location",      "text",         "NOT NULL"),
        ("",   "phone",         "text",         "NOT NULL"),
        ("",   "email",         "text",         "NOT NULL"),
        ("",   "working_hours", "text",         "NOT NULL"),
        ("",   "holiday_note",  "text",         ""),
        ("",   "latitude",      "numeric(9,6)", ""),
        ("",   "longitude",     "numeric(9,6)", ""),
        ("",   "updated_at",    "timestamptz",  "NOT NULL"),
    ], notes=[
        "single row. CHECK (id = 1) keeps it that way",
        "the office card on the /contact page",
    ]),
]

LEGEND = [
    "LEGEND",
    "",
    "PK  primary key          FK  foreign key",
    "arrows point from the foreign key to the table it references",
    "",
    "CONVENTIONS",
    "  snake_case tables and columns, plural table names",
    "  every timestamp is timestamptz, never timestamp",
    "  created_at / updated_at on every mutable table",
    "  no SLA columns anywhere (SLA stats removed from the UI)",
    "",
    "WHAT IS DERIVED, NOT STORED",
    "  avg resolution time   from post_status_history",
    "  monthly trend chart   GROUP BY date_trunc('month', created_at)",
    "  per-ward totals       GROUP BY ward_id",
    "  tag colours / icon colours  -> frontend only, never the API",
]

# ── excalidraw element plumbing ─────────────────────────────────────
B62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
_idx = 0


def next_index():
    """Fixed-width fractional index so lexicographic order == insertion order."""
    global _idx
    hi, lo = divmod(_idx, 62)
    _idx += 1
    return "b" + B62[hi] + B62[lo]


_nid = 0


def nid(prefix):
    global _nid
    _nid += 1
    return f"{prefix}{_nid:03d}"


def rnd():
    return random.randint(1, 2 ** 31)


def el(kind, x, y, w, h, **kw):
    e = {
        "id": kw.pop("id", nid("el")),
        "type": kind,
        "x": float(x), "y": float(y),
        "width": float(w), "height": float(h),
        "angle": 0,
        "strokeColor": "#1e1e1e",
        "backgroundColor": "transparent",
        "fillStyle": "solid",
        "strokeWidth": 2,
        "strokeStyle": "solid",
        "roughness": 0,
        "opacity": 100,
        "groupIds": [],
        "frameId": None,
        "index": next_index(),
        "roundness": None,
        "seed": rnd(),
        "version": 1,
        "versionNonce": rnd(),
        "isDeleted": False,
        "boundElements": [],
        "updated": NOW,
        "link": None,
        "locked": False,
    }
    e.update(kw)
    return e


def text(x, y, body, size, color="#1e1e1e", bold_family=3):
    lines = body.split("\n")
    w = max((len(l) for l in lines), default=1) * size * 0.6
    h = len(lines) * size * FIELD_LH
    return el(
        "text", x, y, w, h,
        strokeColor=color,
        text=body,
        originalText=body,
        fontSize=size,
        fontFamily=bold_family,
        textAlign="left",
        verticalAlign="top",
        containerId=None,
        lineHeight=FIELD_LH,
        autoResize=True,
    )


def hline(x, y, w, dashed=False):
    return el(
        "line", x, y, w, 0,
        strokeWidth=1,
        strokeStyle="dashed" if dashed else "solid",
        strokeColor="#868e96" if dashed else "#1e1e1e",
        points=[[0, 0], [float(w), 0]],
        lastCommittedPoint=None,
        startBinding=None,
        endBinding=None,
        startArrowhead=None,
        endArrowhead=None,
        polygon=False,
    )


def fmt_field(key, name, typ, flags):
    return f"{key:<{F_KEY}}{name:<{F_NAME}}{typ:<{F_TYPE}}{flags}".rstrip()


# ── build boxes ─────────────────────────────────────────────────────
elements = []
boxes = {}          # name -> rect element
col_y = {}

for spec in SCHEMA:
    col = spec["col"]
    x = col * (BOX_W + COL_GAP)
    y = col_y.get(col, 0)

    field_lines = [fmt_field(*f) for f in spec["fields"]]
    notes = spec.get("notes", [])

    h = HEADER_H + PAD_Y + len(field_lines) * FIELD_ROW + PAD_Y
    if notes:
        h += NOTE_SEP_H + len(notes) * NOTE_ROW + PAD_Y
    h = round(h)

    rect = el(
        "rectangle", x, y, BOX_W, h,
        id=f"tbl-{spec['name']}",
        backgroundColor=PALETTE[spec["group"]],
        roundness={"type": 3},
    )
    elements.append(rect)
    boxes[spec["name"]] = rect

    elements.append(text(x + PAD_X, y + 12, spec["name"], 20))
    elements.append(hline(x, y + HEADER_H, BOX_W))

    fy = y + HEADER_H + PAD_Y
    elements.append(text(x + PAD_X, fy, "\n".join(field_lines), FIELD_SIZE))

    if notes:
        ny = fy + len(field_lines) * FIELD_ROW + NOTE_SEP_H
        elements.append(hline(x + PAD_X, ny - 7, BOX_W - 2 * PAD_X, dashed=True))
        elements.append(text(x + PAD_X, ny, "\n".join(notes), NOTE_SIZE, "#5c5f66"))

    col_y[col] = y + h + ROW_GAP

# ── relationship arrows ─────────────────────────────────────────────
RELATIONS = [
    ("refresh_tokens", "users"),
    ("users", "departments"),
    ("posts", "users"),
    ("posts", "categories"),
    ("posts", "wards"),
    ("posts", "departments"),
    ("categories", "departments"),
    ("post_status_history", "posts"),
    ("post_status_history", "users"),
    ("media", "posts"),
    ("comments", "posts"),
    ("comments", "users"),
    ("post_likes", "posts"),
    ("post_likes", "users"),
    ("comment_likes", "comments"),
    ("comment_likes", "users"),
    ("contact_messages", "contact_categories"),
    ("contact_messages", "users"),
]


def center(r):
    return r["x"] + r["width"] / 2, r["y"] + r["height"] / 2


def clip(r, cx, cy, dx, dy, gap=8):
    """Walk from box centre (cx,cy) along (dx,dy) to the box edge, plus gap."""
    hw, hh = r["width"] / 2 + gap, r["height"] / 2 + gap
    ts = []
    if dx:
        ts.append(hw / abs(dx))
    if dy:
        ts.append(hh / abs(dy))
    t = min(ts) if ts else 0
    return cx + dx * t, cy + dy * t


for child, parent in RELATIONS:
    if child == parent:
        continue
    a, b = boxes[child], boxes[parent]
    ax, ay = center(a)
    bx, by = center(b)
    dx, dy = bx - ax, by - ay
    norm = (dx ** 2 + dy ** 2) ** 0.5 or 1
    ux, uy = dx / norm, dy / norm

    sx, sy = clip(a, ax, ay, ux, uy)
    ex, ey = clip(b, bx, by, -ux, -uy)

    aid = nid("arw")
    arrow = el(
        "arrow", sx, sy, abs(ex - sx), abs(ey - sy),
        id=aid,
        strokeColor="#1971c2",
        strokeWidth=1,
        points=[[0, 0], [ex - sx, ey - sy]],
        lastCommittedPoint=None,
        startBinding={"elementId": a["id"], "focus": 0, "gap": 8, "fixedPoint": None},
        endBinding={"elementId": b["id"], "focus": 0, "gap": 8, "fixedPoint": None},
        startArrowhead=None,
        endArrowhead="arrow",
        elbowed=False,
        roundness={"type": 2},
    )
    elements.append(arrow)
    a["boundElements"].append({"id": aid, "type": "arrow"})
    b["boundElements"].append({"id": aid, "type": "arrow"})

# ── title + legend ──────────────────────────────────────────────────
min_y = min(b["y"] for b in boxes.values())
elements.append(text(0, min_y - 130, "OurCityVoice  -  database schema", 36))
elements.append(
    text(0, min_y - 78, "generated by backend/docs/generate-er.py  -  edit SCHEMA there, re-run, re-paste",
         14, "#868e96")
)

legend_col = max(s["col"] for s in SCHEMA)
lx = (legend_col + 1) * (BOX_W + COL_GAP)
ly = min_y
lh = round(PAD_Y * 2 + len(LEGEND) * NOTE_ROW + 10)
elements.append(
    el("rectangle", lx, ly, BOX_W + 60, lh,
       backgroundColor="#f8f9fa", strokeStyle="dashed", strokeWidth=1,
       roundness={"type": 3})
)
elements.append(text(lx + PAD_X, ly + PAD_Y, "\n".join(LEGEND), NOTE_SIZE, "#343a40"))

# ── write ───────────────────────────────────────────────────────────
payload = {
    "type": "excalidraw/clipboard",
    "elements": elements,
    "files": {},
}

out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "database-er.txt")
with open(out, "w") as f:
    json.dump(payload, f)

print(f"wrote {out}")
print(f"  {len(SCHEMA)} tables, {len(RELATIONS)} relations, {len(elements)} elements")
