/**
 * Loads the frontend's mock fixtures into real tables.
 *
 *   ./dev.sh seed
 *
 * The data comes from prisma/seed-data/mock-data.json, which is extracted from
 * frontend/data/mock-data.ts by prisma/extract-mock-data.ts. Seeding from the
 * same fixtures the UI already renders means you can swap a page from mock
 * imports to real fetches and compare the two side by side.
 *
 * Two properties worth preserving as this grows:
 *
 *   Idempotent. It truncates first, so running it twice gives the same result
 *   rather than duplicate rows.
 *
 *   Self-consistent. The denormalised counters on posts (like_count,
 *   comment_count) are recomputed from the rows actually inserted, never
 *   copied from the mock numbers. The whole point of those columns is that
 *   they are a cache of real rows, and a seed that fakes them teaches the
 *   wrong lesson on day one.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import type { MediaType, PostPriority, PostStatus, UserRole } from "../src/generated/prisma/enums.js";

import { hashPassword } from "../src/lib/password.js";

const here = dirname(fileURLToPath(import.meta.url));

// ── guards ──────────────────────────────────────────────────────────

if (process.env.NODE_ENV === "production") {
  console.error("refusing to seed: NODE_ENV is production. This script truncates every table.");
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

// ── fixtures ────────────────────────────────────────────────────────

interface MockUpdate {
  id: string;
  status: string;
  title: string;
  note: string;
  date: string;
  actor: string;
}

interface MockPost {
  id: string;
  code: string;
  date: string;
  tag: string;
  location: string;
  title: string;
  desc: string;
  likes: number;
  views: number;
  image: string;
  video?: string;
  isVideo?: boolean;
  duration?: string;
  status: string;
  priority: string;
  ward: string;
  department: string;
  assignedOfficer?: string;
  reportedBy: string;
  street?: string;
  city: string;
  address: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  details: string[];
  gallery: string[];
  updates: MockUpdate[];
}

interface MockReport {
  id: string;
  trackingId: string;
  title: string;
  category: string;
  ward: string;
  location: string;
  street?: string;
  city: string;
  address: string;
  postalCode?: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  priority: string;
  date: string;
  description: string;
  upvotes: number;
  commentsCount: number;
  views: number;
  department: string;
  image: string;
  assignedOfficer?: string;
}

interface MockComment {
  id: string;
  postId: string;
  author: string;
  role: string;
  time: string;
  body: string;
  likes: number;
  replies?: MockComment[];
}

interface MockCategory {
  id: string;
  label: string;
  icon: string | null;
  isOther?: boolean;
}

interface Fixtures {
  categories: MockCategory[];
  posts: MockPost[];
  postComments: MockComment[];
  initialReports: MockReport[];
}

const fixtures: Fixtures = JSON.parse(
  readFileSync(join(here, "seed-data", "mock-data.json"), "utf8"),
);

// ── value mapping ───────────────────────────────────────────────────

const STATUS: Record<string, PostStatus> = {
  Pending: "pending",
  "In Progress": "in_progress",
  Resolved: "resolved",
  Rejected: "rejected",
};

const PRIORITY: Record<string, PostPriority> = {
  Low: "low",
  Medium: "medium",
  High: "high",
  Critical: "critical",
};

/** The frontend's comment roles collapse onto three account roles. */
const ROLE_FROM_COMMENTER: Record<string, UserRole> = {
  Resident: "citizen",
  "Local Business": "citizen",
  "Field Inspector": "officer",
  "Municipal Officer": "officer",
  "Ward Councillor": "officer",
};

/**
 * Fixture category labels to slugs. Built from the category list rather than
 * hand-written, so a renamed category cannot silently fall through to "other".
 * "all" is a UI filter pseudo-entry, not a category.
 */
const CATEGORY_SLUG = new Map(
  fixtures.categories.filter((c) => c.id !== "all").map((c) => [c.label, c.id]),
);

/** Which department handles a category by default. */
const CATEGORY_DEPARTMENT: Record<string, string> = {
  roads: "Transportation Services",
  sidewalks: "Transportation Services",
  water: "Water & Sewerage Board",
  stormwater: "Sanitation & Waste Management",
  parks: "Parks & Urban Forestry",
  waste: "Sanitation & Waste Management",
  streetlights: "Electrical Safety Cell",
  buildings: "Public Works Department",
  transit: "Transit & Mobility Office",
  environment: "Parks & Urban Forestry",
  community: "Public Works Department",
  other: "Public Works Department",
};

const DEPARTMENTS = [
  "Transportation Services",
  "Public Works Department",
  "Electrical Safety Cell",
  "Sanitation & Waste Management",
  "Water & Sewerage Board",
  "Parks & Urban Forestry",
  "Transit & Mobility Office",
];

const CONTACT_CATEGORIES = [
  "General Enquiry",
  "Report a Problem",
  "Feedback or Suggestion",
  "Media & Press",
  "Partnership",
];

// ── helpers ─────────────────────────────────────────────────────────

/** "Ward 03 (Sector 4 Bypass)" -> "ward-03" */
function wardCode(name: string): string {
  const match = /Ward\s+0*(\d+)/i.exec(name);
  return match ? `ward-${match[1]!.padStart(2, "0")}` : slugify(name);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Handles both fixture date shapes: "Oct 26, 2026", "2026-09-28" and
 * "Oct 26, 2026 · 08:14". Falls back to now rather than inserting an Invalid
 * Date, which Postgres would reject with a far less obvious error.
 */
function parseDate(value: string, fallback = new Date()): Date {
  const cleaned = value.replace("·", " ").replace(/\s+/g, " ").trim();
  const parsed = new Date(cleaned);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

/**
 * Decimal columns take a string so the value lands in Postgres exactly as
 * written, with no float round-trip. Six places matches DECIMAL(9,6).
 */
function decimal(value: number | null | undefined): string | null {
  return value === null || value === undefined ? null : value.toFixed(6);
}

// Coordinates come from the fixtures, which were geocoded once from
// street + city against Nominatim and then written down. That keeps this
// script offline and deterministic: seeding twice gives identical rows, and
// a flaky network cannot produce a half-mapped database.
//
// Reports created through the API need the opposite arrangement. The post
// service should resolve coordinates at write time, in this order:
//
//   1. the pin the reporter dropped on the map, if the form sent one
//   2. a geocode of street + city, spaced to one request per second and
//      capped with a short timeout
//   3. null
//
// Step two must never fail the insert. A citizen reporting a burst water main
// should not see an error because a third-party geocoder timed out, and a
// marker at a guessed position is worse than no marker. Rows that come out
// null get picked up by a backfill pass. Rate limit the submit endpoint too:
// without that, an anonymous caller can drive outbound geocode requests until
// the server's IP is blocked.

function emailFor(name: string, taken: Set<string>): string {
  const base = slugify(name).replace(/-+/g, ".") || "user";
  let email = `${base}@ourcityvoice.test`;
  let n = 2;
  while (taken.has(email)) email = `${base}${n++}@ourcityvoice.test`;
  taken.add(email);
  return email;
}

function mediaTypeFor(path: string): MediaType {
  return /\.(mp4|webm|mov)$|lorem\.video/i.test(path) ? "video" : "image";
}

function mimeFor(path: string): string {
  if (mediaTypeFor(path) === "video") return "video/mp4";
  if (/\.png$/i.test(path)) return "image/png";
  return "image/jpeg";
}

/** "0:32" -> 32 */
function durationSeconds(value: string | undefined): number | null {
  if (!value) return null;
  const [m, s] = value.split(":").map(Number);
  if (m === undefined || s === undefined || Number.isNaN(m) || Number.isNaN(s)) return null;
  return m * 60 + s;
}

/** Deterministic pseudo-random, so repeated seeds produce identical data. */
function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 0x1_0000_0000;
  };
}

// ── seed ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const started = Date.now();
  const rng = makeRng(20_261_002);

  console.log("truncating existing data");
  // RESTART IDENTITY so ids start at 1 every run, CASCADE so foreign keys do
  // not block the order. One statement is atomic, unlike 14 deleteMany calls.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      comment_likes, post_likes, comments, media, post_status_history,
      posts, categories, wards, departments, refresh_tokens, users,
      contact_messages, contact_categories, site_contact_info
    RESTART IDENTITY CASCADE
  `);

  // ── departments ───────────────────────────────────────────────────
  await prisma.department.createMany({
    data: DEPARTMENTS.map((name) => ({
      name,
      email: `${slugify(name)}@ourcityvoice.test`,
      phone: "+1 416 555 0100",
    })),
  });
  const departments = new Map(
    (await prisma.department.findMany()).map((d) => [d.name, d.id]),
  );
  console.log(`  departments        ${departments.size}`);

  // ── wards ─────────────────────────────────────────────────────────
  // The two fixture sets use different ward vocabularies, so take the union.
  const wardNames = [
    ...new Set([
      ...fixtures.posts.map((p) => p.ward),
      ...fixtures.initialReports.map((r) => r.ward),
    ]),
  ].sort();

  await prisma.ward.createMany({
    data: wardNames.map((name) => ({ name, code: wardCode(name) })),
  });
  const wards = new Map((await prisma.ward.findMany()).map((w) => [w.name, w.id]));
  console.log(`  wards              ${wards.size}`);

  // ── categories ────────────────────────────────────────────────────
  // "all" is a UI filter pseudo-entry, not a category.
  const categorySeeds = fixtures.categories
    .filter((c) => c.id !== "all")
    .map((c, index) => ({
      name: c.label,
      slug: c.id,
      icon: c.icon ?? "CircleHelp",
      sortOrder: index,
    }));

  await prisma.category.createMany({
    data: categorySeeds.map((c) => ({
      ...c,
      defaultDepartmentId: departments.get(CATEGORY_DEPARTMENT[c.slug] ?? "") ?? null,
    })),
  });
  const categories = new Map(
    (await prisma.category.findMany()).map((c) => [c.slug, c.id]),
  );
  console.log(`  categories         ${categories.size}`);

  // ── contact ───────────────────────────────────────────────────────
  await prisma.contactCategory.createMany({
    data: CONTACT_CATEGORIES.map((name, sortOrder) => ({ name, sortOrder })),
  });
  await prisma.siteContactInfo.create({
    data: {
      id: 1,
      location: "City Hall, 100 Queen St W, Toronto, ON M5H 2N2",
      phone: "+1 416 555 0100",
      email: "hello@ourcityvoice.test",
      workingHours: "Mon to Fri, 09:00 to 17:00",
      holidayNote: "Closed on public holidays. Emergency reports are triaged 24/7.",
      latitude: "43.653226",
      longitude: "-79.383184",
    },
  });
  console.log(`  contact categories ${CONTACT_CATEGORIES.length}`);

  // ── users ─────────────────────────────────────────────────────────
  // Everyone shares one password so you can log in as any of them while
  // building auth. The hash is computed once; scrypt is deliberately slow and
  // hashing 40 times would dominate the seed's runtime.
  const sharedHash = await hashPassword("password123");
  const takenEmails = new Set<string>();

  interface UserSeed {
    name: string;
    role: UserRole;
    department?: string;
  }
  const userSeeds = new Map<string, UserSeed>();

  const addUser = (name: string, role: UserRole, department?: string): void => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === "Unassigned") return;
    const existing = userSeeds.get(trimmed);
    // Officer beats citizen if the same person appears in both roles.
    if (existing && existing.role !== "citizen") return;
    userSeeds.set(trimmed, { name: trimmed, role, ...(department ? { department } : {}) });
  };

  addUser("Platform Admin", "admin");
  for (const post of fixtures.posts) {
    addUser(post.reportedBy, "citizen");
    if (post.assignedOfficer) addUser(post.assignedOfficer, "officer", post.department);
    for (const update of post.updates) {
      // Some actors are department names or desks rather than people. Those
      // become a null actor on the history row instead of a fake account.
      if (!DEPARTMENTS.includes(update.actor) && update.actor !== "Intake Desk") {
        addUser(update.actor, "citizen");
      }
    }
  }
  for (const report of fixtures.initialReports) {
    if (report.assignedOfficer) addUser(report.assignedOfficer, "officer", report.department);
  }
  const collectComments = (list: MockComment[]): void => {
    for (const comment of list) {
      addUser(comment.author, ROLE_FROM_COMMENTER[comment.role] ?? "citizen");
      if (comment.replies) collectComments(comment.replies);
    }
  };
  collectComments(fixtures.postComments);

  await prisma.user.createMany({
    data: [...userSeeds.values()].map((u) => ({
      name: u.name,
      email: emailFor(u.name, takenEmails),
      passwordHash: sharedHash,
      role: u.role,
      departmentId: u.department ? (departments.get(u.department) ?? null) : null,
    })),
  });
  const users = new Map((await prisma.user.findMany()).map((u) => [u.name, u.id]));
  const citizenIds = (await prisma.user.findMany({ where: { role: "citizen" }, select: { id: true } }))
    .map((u) => u.id);
  console.log(`  users              ${users.size}`);

  // ── posts ─────────────────────────────────────────────────────────
  // Both fixture sets are reports. They use overlapping ids ("1".."8" and
  // "1".."5"), so comments are keyed to the landing-page set only.
  const postIdByFixtureId = new Map<string, bigint>();
  let mediaCount = 0;
  let historyCount = 0;

  for (const post of fixtures.posts) {
    const createdAt = parseDate(post.date);
    const slug = CATEGORY_SLUG.get(post.tag) ?? "other";
    const status = STATUS[post.status] ?? "pending";

    const created = await prisma.post.create({
      data: {
        // Both fixture sets now carry the final tracking code, so there is
        // nothing to normalise here. The UI prints the same string the
        // database stores.
        trackingCode: post.code,
        title: post.title,
        description: [post.desc, ...post.details].join("\n\n"),
        userId: users.get(post.reportedBy)!,
        categoryId: categories.get(slug)!,
        wardId: wards.get(post.ward)!,
        departmentId: departments.get(post.department) ?? null,
        assignedOfficerId: post.assignedOfficer ? (users.get(post.assignedOfficer) ?? null) : null,
        status,
        priority: PRIORITY[post.priority] ?? "medium",
        street: post.street ?? null,
        city: post.city,
        address: post.address,
        postalCode: post.postalCode,
        latitude: decimal(post.latitude),
        longitude: decimal(post.longitude),
        viewCount: post.views,
        resolvedAt: status === "resolved" ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      },
    });
    postIdByFixtureId.set(post.id, created.id);

    // media: the hero image, then the gallery, then any video
    const assets = [...new Set([post.image, ...post.gallery])];
    if (post.video) assets.push(post.video);
    await prisma.media.createMany({
      data: assets.map((asset, index) => ({
        postId: created.id,
        type: mediaTypeFor(asset),
        // Fixtures hold paths and URLs. Real uploads would store a bucket key.
        storageKey: asset,
        thumbnailKey: mediaTypeFor(asset) === "video" ? post.image : null,
        mimeType: mimeFor(asset),
        sizeBytes: BigInt(180_000 + Math.floor(rng() * 2_000_000)),
        durationSecs: mediaTypeFor(asset) === "video" ? durationSeconds(post.duration) : null,
        sortOrder: index,
      })),
    });
    mediaCount += assets.length;

    // status history, straight from the fixture timeline
    let previous: PostStatus | null = null;
    for (const update of post.updates) {
      const to = STATUS[update.status] ?? "pending";
      await prisma.postStatusHistory.create({
        data: {
          postId: created.id,
          actorId: users.get(update.actor) ?? null,
          fromStatus: previous,
          toStatus: to,
          title: update.title,
          note: update.note,
          createdAt: parseDate(update.date, createdAt),
        },
      });
      previous = to;
      historyCount += 1;
    }
  }

  for (const report of fixtures.initialReports) {
    const createdAt = parseDate(report.date);
    const slug = CATEGORY_SLUG.get(report.category) ?? "other";
    const status = STATUS[report.status] ?? "pending";
    // This fixture set has no reporter, so reports are spread across citizens.
    const authorId = citizenIds[Math.floor(rng() * citizenIds.length)]!;

    const created = await prisma.post.create({
      data: {
        trackingCode: report.trackingId,
        title: report.title,
        description: report.description,
        userId: authorId,
        categoryId: categories.get(slug)!,
        wardId: wards.get(report.ward)!,
        departmentId: departments.get(report.department) ?? null,
        assignedOfficerId: report.assignedOfficer ? (users.get(report.assignedOfficer) ?? null) : null,
        status,
        priority: PRIORITY[report.priority] ?? "medium",
        street: report.street ?? null,
        city: report.city,
        address: report.address,
        postalCode: report.postalCode ?? null,
        latitude: decimal(report.latitude),
        longitude: decimal(report.longitude),
        viewCount: report.views,
        resolvedAt: status === "resolved" ? createdAt : null,
        createdAt,
        updatedAt: createdAt,
      },
    });

    await prisma.media.create({
      data: {
        postId: created.id,
        type: "image",
        storageKey: report.image,
        mimeType: "image/jpeg",
        sizeBytes: BigInt(180_000 + Math.floor(rng() * 2_000_000)),
        sortOrder: 0,
      },
    });
    mediaCount += 1;

    // No fixture timeline here, so synthesise the minimum that keeps
    // post_status_history the source of truth: a creation row, plus one row
    // per step up to the current status.
    const chain: PostStatus[] = status === "pending" ? ["pending"] : ["pending", status];
    let previous: PostStatus | null = null;
    for (const [index, to] of chain.entries()) {
      await prisma.postStatusHistory.create({
        data: {
          postId: created.id,
          actorId: index === 0 ? authorId : (users.get(report.assignedOfficer ?? "") ?? null),
          fromStatus: previous,
          toStatus: to,
          title: index === 0 ? "Report submitted" : `Status changed to ${to.replace("_", " ")}`,
          note: index === 0 ? "Report received and queued for triage." : null,
          createdAt: new Date(createdAt.getTime() + index * 86_400_000),
        },
      });
      previous = to;
      historyCount += 1;
    }
  }
  console.log(`  posts              ${postIdByFixtureId.size + fixtures.initialReports.length}`);
  console.log(`  media              ${mediaCount}`);
  console.log(`  status history     ${historyCount}`);

  // ── comments ──────────────────────────────────────────────────────
  let commentCount = 0;

  const insertComment = async (
    comment: MockComment,
    postId: bigint,
    parentId: bigint | null,
  ): Promise<void> => {
    const created = await prisma.comment.create({
      data: {
        postId,
        userId: users.get(comment.author)!,
        parentId,
        message: comment.body,
        createdAt: new Date(Date.now() - Math.floor(rng() * 7 * 86_400_000)),
      },
    });
    commentCount += 1;

    // Real like rows, not a counter. likeCount is recomputed from these below.
    const likers = [...citizenIds].sort(() => rng() - 0.5).slice(0, Math.min(comment.likes, citizenIds.length));
    if (likers.length > 0) {
      await prisma.commentLike.createMany({
        data: likers.map((userId) => ({ commentId: created.id, userId })),
      });
    }

    for (const reply of comment.replies ?? []) {
      await insertComment(reply, postId, created.id);
    }
  };

  for (const comment of fixtures.postComments) {
    const postId = postIdByFixtureId.get(comment.postId);
    if (!postId) continue;
    await insertComment(comment, postId, null);
  }
  console.log(`  comments           ${commentCount}`);

  // ── likes ─────────────────────────────────────────────────────────
  // One row per (post, user), which the unique index enforces. Taking a slice
  // of a shuffled list is what guarantees no duplicate pair.
  let likeCount = 0;
  for (const post of fixtures.posts) {
    const postId = postIdByFixtureId.get(post.id)!;
    const likers = [...citizenIds].sort(() => rng() - 0.5).slice(0, Math.min(post.likes, citizenIds.length));
    if (likers.length === 0) continue;
    await prisma.postLike.createMany({
      data: likers.map((userId) => ({ postId, userId })),
    });
    likeCount += likers.length;
  }
  for (const report of fixtures.initialReports) {
    const post = await prisma.post.findUnique({ where: { trackingCode: report.trackingId } });
    if (!post) continue;
    const likers = [...citizenIds].sort(() => rng() - 0.5).slice(0, Math.min(report.upvotes, citizenIds.length));
    if (likers.length === 0) continue;
    await prisma.postLike.createMany({
      data: likers.map((userId) => ({ postId: post.id, userId })),
    });
    likeCount += likers.length;
  }
  console.log(`  post likes         ${likeCount}`);

  // ── reconcile the cached counters ─────────────────────────────────
  // Derived from the rows above, never from the fixture numbers. This is the
  // same statement a nightly job would run to repair drift.
  await prisma.$executeRawUnsafe(`
    UPDATE posts p SET
      like_count    = (SELECT count(*) FROM post_likes pl WHERE pl.post_id = p.id),
      comment_count = (SELECT count(*) FROM comments c WHERE c.post_id = p.id AND c.deleted_at IS NULL)
  `);
  await prisma.$executeRawUnsafe(`
    UPDATE comments c SET
      like_count = (SELECT count(*) FROM comment_likes cl WHERE cl.comment_id = c.id)
  `);
  console.log("  counters reconciled from real rows");

  console.log(`\ndone in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  console.log("every seeded account uses the password: password123");
}

main()
  .catch((error: unknown) => {
    console.error("\nseed failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
