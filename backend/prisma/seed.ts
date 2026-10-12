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

interface MockMedia {
  type: MediaType;
  storageKey: string;
  thumbnailKey: string | null;
  mimeType: string;
  /** BigInt, serialized to a string by the API and by the extractor. */
  sizeBytes: string;
  durationSecs: number | null;
  sortOrder: number;
}

interface MockCategoryRef {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface MockWardRef {
  id: string;
  name: string;
  code: string;
}

interface MockNamedRef {
  id: string;
  name: string;
}

interface MockAuthorRef {
  id: string;
  name: string;
  avatarUrl: string | null;
}

/**
 * A post exactly as the API ships it (see frontend/types/report.ts). The
 * extractor writes this object straight out of mock-data.ts, so the seed reads
 * the same columns the UI does, with no second vocabulary to keep in step.
 */
interface MockReport {
  id: string;
  trackingCode: string;
  title: string;
  description: string;

  status: string;
  priority: string;
  isAnonymous: boolean;

  category: MockCategoryRef;
  ward: MockWardRef;
  department: MockNamedRef | null;
  author: MockAuthorRef | null;
  assignedOfficer: MockNamedRef | null;

  street: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  latitude: number | null;
  longitude: number | null;

  viewCount: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;

  media: MockMedia[];

  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MockTimelineEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  title: string;
  note: string | null;
  actor: MockNamedRef | null;
  createdAt: string;
}

interface MockTimeline {
  postId: string;
  entries: MockTimelineEntry[];
}

interface MockCommentAuthor {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  departmentId: string | null;
}

interface MockComment {
  id: string;
  postId: string;
  message: string;
  likeCount: number;
  likedByMe: boolean;
  author: MockCommentAuthor;
  createdAt: string;
  updatedAt: string;
  replies?: MockComment[];
}

interface MockCategory {
  id: string;
  label: string;
  icon: string | null;
  isOther?: boolean;
}

interface MockWard {
  code: string;
  name: string;
}

interface Fixtures {
  categories: MockCategory[];
  posts: MockReport[];
  postTimelines: MockTimeline[];
  postComments: MockComment[];
  initialReports: MockReport[];
  reportWards: MockWard[];
}

const fixtures: Fixtures = JSON.parse(
  readFileSync(join(here, "seed-data", "mock-data.json"), "utf8"),
);

// ── value mapping ───────────────────────────────────────────────────

/**
 * Seed-only roles.
 *
 * The database has two roles, `user` and `super_admin`. These three are a
 * property of the fixtures rather than of an account: the seed needs to know
 * which people are residents, because residents are who it picks from when
 * authoring comments and likes. Giving a councillor a like on their own ward's
 * report would be odd, and nothing in the schema would stop it.
 */
type SeedRole = "resident" | "staff" | "admin";

/** Seed role to the role the column actually holds. See schema.prisma. */
const DB_ROLE: Record<SeedRole, UserRole> = {
  resident: "user",
  staff: "user",
  admin: "super_admin",
};

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
  // The reportWards list is the canonical filter set; the post and report
  // fixtures then add any ward they use that is not on it. Codes come from
  // the fixtures, so a rename in the frontend data propagates here.
  const wardSeeds = new Map<string, string>();
  for (const ward of fixtures.reportWards) wardSeeds.set(ward.code, ward.name);
  for (const ward of [
    ...fixtures.posts.map((p) => p.ward),
    ...fixtures.initialReports.map((r) => r.ward),
  ]) {
    if (!wardSeeds.has(ward.code)) wardSeeds.set(ward.code, ward.name);
  }

  await prisma.ward.createMany({
    data: [...wardSeeds.entries()].map(([code, name]) => ({ code, name })),
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
  //
  // That includes "Platform Admin", who is seeded as a super_admin with the
  // same known password. Safe only because this file is development-only: it
  // opens by truncating every table, so it can never be pointed at anything
  // real. A super admin for a deployed database is made with `pnpm admin:create`.
  const sharedHash = await hashPassword("password123");
  const takenEmails = new Set<string>();

  interface UserSeed {
    name: string;
    role: SeedRole;
    department?: string;
  }
  const userSeeds = new Map<string, UserSeed>();

  const addUser = (name: string, role: SeedRole, department?: string): void => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === "Unassigned") return;
    const existing = userSeeds.get(trimmed);
    // Staff beats resident if the same person appears in both roles.
    if (existing && existing.role !== "resident") return;
    userSeeds.set(trimmed, { name: trimmed, role, ...(department ? { department } : {}) });
  };

  // The curated status timelines, keyed for reuse below. Actors on these rows
  // are the only place some staff names appear, so they feed the user list too.
  const timelinesByPost = new Map(
    fixtures.postTimelines.map((timeline) => [timeline.postId, timeline.entries]),
  );

  const addTimelineActors = (entries: MockTimelineEntry[]): void => {
    for (const entry of entries) {
      if (!entry.actor) continue;
      // Some actors are department names or desks rather than people. Those
      // become a null actor on the history row instead of a fake account.
      if (DEPARTMENTS.includes(entry.actor.name) || entry.actor.name === "Intake Desk") {
        continue;
      }
      addUser(entry.actor.name, "resident");
    }
  };

  addUser("Platform Admin", "admin");
  for (const post of fixtures.posts) {
    if (post.author) addUser(post.author.name, "resident");
    if (post.assignedOfficer) {
      addUser(post.assignedOfficer.name, "staff", post.department?.name);
    }
    addTimelineActors(timelinesByPost.get(post.id) ?? []);
  }
  for (const report of fixtures.initialReports) {
    if (report.assignedOfficer) {
      addUser(report.assignedOfficer.name, "staff", report.department?.name);
    }
  }
  const collectComments = (list: MockComment[]): void => {
    for (const comment of list) {
      // The fixtures mark a commenter as belonging to a department; that is
      // what keeps staff out of the resident pool the seed draws from below.
      addUser(comment.author.name, comment.author.departmentId ? "staff" : "resident");
      if (comment.replies) collectComments(comment.replies);
    }
  };
  collectComments(fixtures.postComments);

  await prisma.user.createMany({
    data: [...userSeeds.values()].map((u) => ({
      name: u.name,
      email: emailFor(u.name, takenEmails),
      passwordHash: sharedHash,
      role: DB_ROLE[u.role],
      departmentId: u.department ? (departments.get(u.department) ?? null) : null,
    })),
  });
  const users = new Map((await prisma.user.findMany()).map((u) => [u.name, u.id]));
  // Residents, for authoring comments and spreading likes around. This used to
  // be a `where: { role: "citizen" }` query, which no longer has an answer: the
  // column holds `user` for everybody but the admin now, so the resident
  // distinction only exists in the fixtures.
  const residentIds = [...userSeeds.values()]
    .filter((u) => u.role === "resident")
    .map((u) => users.get(u.name))
    .filter((id): id is bigint => id !== undefined);
  console.log(`  users              ${users.size}`);

  // ── posts ─────────────────────────────────────────────────────────
  // Both fixture sets are reports. They use overlapping ids ("1".."8" and
  // "1".."5"), so comments are keyed to the landing-page set only.
  const postIdByFixtureId = new Map<string, bigint>();
  let mediaCount = 0;
  let historyCount = 0;

  for (const post of fixtures.posts) {
    const createdAt = parseDate(post.createdAt);
    const status = post.status as PostStatus;

    const created = await prisma.post.create({
      data: {
        // Fixtures now carry the final tracking code, so there is nothing to
        // normalise here. The UI prints the same string the database stores.
        trackingCode: post.trackingCode,
        title: post.title,
        description: post.description,
        userId: users.get(post.author?.name ?? "") ?? residentIds[0]!,
        categoryId: categories.get(post.category.slug)!,
        wardId: wards.get(post.ward.name)!,
        departmentId: post.department
          ? (departments.get(post.department.name) ?? null)
          : null,
        assignedOfficerId: post.assignedOfficer
          ? (users.get(post.assignedOfficer.name) ?? null)
          : null,
        status,
        priority: post.priority as PostPriority,
        isAnonymous: post.isAnonymous,
        street: post.street,
        city: post.city ?? "",
        address: post.address ?? "",
        postalCode: post.postalCode,
        latitude: decimal(post.latitude),
        longitude: decimal(post.longitude),
        viewCount: post.viewCount,
        // The fixture carries the instant its status timeline reached
        // "resolved", so there is nothing to infer from the current status.
        resolvedAt: post.resolvedAt ? parseDate(post.resolvedAt) : null,
        createdAt,
        updatedAt: parseDate(post.updatedAt, createdAt),
      },
    });
    postIdByFixtureId.set(post.id, created.id);

    // media, straight from the fixture rows: every post carries its own
    // Media-shaped list, so there is nothing to infer or synthesise here.
    await prisma.media.createMany({
      data: post.media.map((item) => ({
        postId: created.id,
        type: item.type,
        storageKey: item.storageKey,
        thumbnailKey: item.thumbnailKey,
        mimeType: item.mimeType,
        sizeBytes: BigInt(item.sizeBytes),
        durationSecs: item.durationSecs,
        sortOrder: item.sortOrder,
      })),
    });
    mediaCount += post.media.length;

    // status history, straight from the curated fixture timeline
    for (const entry of timelinesByPost.get(post.id) ?? []) {
      await prisma.postStatusHistory.create({
        data: {
          postId: created.id,
          actorId: entry.actor ? (users.get(entry.actor.name) ?? null) : null,
          fromStatus: entry.fromStatus as PostStatus | null,
          toStatus: entry.toStatus as PostStatus,
          title: entry.title,
          note: entry.note,
          createdAt: parseDate(entry.createdAt, createdAt),
        },
      });
      historyCount += 1;
    }
  }

  for (const report of fixtures.initialReports) {
    const createdAt = parseDate(report.createdAt);
    const status = report.status as PostStatus;
    // This fixture set has no reporter, so reports are spread across residents.
    const authorId = residentIds[Math.floor(rng() * residentIds.length)]!;

    const created = await prisma.post.create({
      data: {
        trackingCode: report.trackingCode,
        title: report.title,
        description: report.description,
        userId: authorId,
        categoryId: categories.get(report.category.slug)!,
        wardId: wards.get(report.ward.name)!,
        departmentId: report.department
          ? (departments.get(report.department.name) ?? null)
          : null,
        assignedOfficerId: report.assignedOfficer
          ? (users.get(report.assignedOfficer.name) ?? null)
          : null,
        status,
        priority: report.priority as PostPriority,
        isAnonymous: report.isAnonymous,
        street: report.street,
        city: report.city ?? "",
        address: report.address ?? "",
        postalCode: report.postalCode,
        latitude: decimal(report.latitude),
        longitude: decimal(report.longitude),
        viewCount: report.viewCount,
        // The fixture set carries no resolved instant, so this stays null;
        // the schema's resolvedAt is optional.
        resolvedAt: report.resolvedAt ? parseDate(report.resolvedAt) : null,
        createdAt,
        updatedAt: parseDate(report.updatedAt, createdAt),
      },
    });

    await prisma.media.createMany({
      data: report.media.map((item) => ({
        postId: created.id,
        type: item.type,
        storageKey: item.storageKey,
        thumbnailKey: item.thumbnailKey,
        mimeType: item.mimeType,
        sizeBytes: BigInt(item.sizeBytes),
        durationSecs: item.durationSecs,
        sortOrder: item.sortOrder,
      })),
    });
    mediaCount += report.media.length;

    // No fixture timeline here, so synthesise the minimum that keeps
    // post_status_history the source of truth: a creation row, plus one row
    // per step up to the current status.
    const chain: PostStatus[] = status === "pending" ? ["pending"] : ["pending", status];
    let previous: PostStatus | null = null;
    for (const [index, to] of chain.entries()) {
      await prisma.postStatusHistory.create({
        data: {
          postId: created.id,
          actorId: index === 0
            ? authorId
            : (users.get(report.assignedOfficer?.name ?? "") ?? null),
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
        userId: users.get(comment.author.name)!,
        parentId,
        message: comment.message,
        createdAt: parseDate(comment.createdAt),
      },
    });
    commentCount += 1;

    // Real like rows, not a counter. likeCount is recomputed from these below.
    const likers = [...residentIds].sort(() => rng() - 0.5).slice(0, Math.min(comment.likeCount, residentIds.length));
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
    const likers = [...residentIds].sort(() => rng() - 0.5).slice(0, Math.min(post.likeCount, residentIds.length));
    if (likers.length === 0) continue;
    await prisma.postLike.createMany({
      data: likers.map((userId) => ({ postId, userId })),
    });
    likeCount += likers.length;
  }
  for (const report of fixtures.initialReports) {
    const post = await prisma.post.findUnique({ where: { trackingCode: report.trackingCode } });
    if (!post) continue;
    const likers = [...residentIds].sort(() => rng() - 0.5).slice(0, Math.min(report.likeCount, residentIds.length));
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
