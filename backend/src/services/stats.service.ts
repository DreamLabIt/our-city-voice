import { prisma } from "../db/prisma.js";
import { Prisma } from "../generated/prisma/client.js";
import type { PostPriority, PostStatus } from "../generated/prisma/enums.js";

/**
 * Platform statistics.
 *
 * Every figure is computed in the database — counts, group-bys and one ordered
 * aggregate for the median — rather than by loading every report and reducing in
 * memory. The public statistics page used to reduce on the client, which is
 * fine for the fixtures it ran on and wrong the moment the table is a city's.
 *
 * A report that has been soft-deleted is not counted anywhere here. A moderated
 * report is gone as far as every read is concerned, and a statistic is a read.
 */

export interface StatusCount {
  status: PostStatus;
  count: number;
}

export interface CountRow {
  label: string;
  count: number;
}

export interface WardBreakdown {
  ward: string;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  rejected: number;
}

export interface ReportStatistics {
  total: number;
  open: number;
  resolved: number;
  resolutionRate: number;

  byStatus: StatusCount[];
  byPriority: CountRow[];
  byCategory: CountRow[];
  byWard: WardBreakdown[];

  upvotes: number;
  comments: number;
  views: number;

  medianResolutionHours: number | null;
  resolutionSampleSize: number;

  firstReportDate: string | null;
  latestReportDate: string | null;
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface ActivitySummary {
  year: number;
  reports: number;
  comments: number;
  activeUsers: number;
  reportsThisMonth: number;
  reportsLastMonth: number;
  reportsChangePercent: number | null;
  monthly: MonthCount[];
}

export interface AdminOverview {
  stats: ReportStatistics;
  moderation: { deleted: number };
  users: { total: number; superAdmins: number; newThisMonth: number };
  contactMessages: { total: number; unhandled: number };
  activity: ActivitySummary;
}

const STATUS_ORDER: PostStatus[] = ["pending", "in_progress", "resolved", "rejected"];

// Severity order, not frequency order: a reader scanning priorities wants
// Critical first whether or not it is the biggest bucket.
const PRIORITY_ORDER: PostPriority[] = ["critical", "high", "medium", "low"];

const PRIORITY_LABEL: Record<PostPriority, string> = {
  critical: "Critical",
  high: "High",
  medium: "Medium",
  low: "Low",
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function scopeWhere(userId?: bigint): Prisma.PostWhereInput {
  return {
    deletedAt: null,
    ...(userId !== undefined ? { userId } : {}),
  };
}

/**
 * Median hours from a report being filed to being resolved, plus how many
 * reports that median is based on.
 *
 * This is the one figure `groupBy` cannot produce. `percentile_cont` does it in
 * one ordered aggregate instead of pulling every resolved row's two timestamps
 * into memory to sort them here. The cast to `double precision` matters: without
 * it the interval math yields `numeric`, which the driver hands back as a string.
 */
async function resolutionStatistics(
  userId?: bigint,
): Promise<{ medianHours: number | null; sampleSize: number }> {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`p.deleted_at IS NULL`,
    Prisma.sql`p.status = 'resolved'`,
    Prisma.sql`p.resolved_at IS NOT NULL`,
  ];

  if (userId !== undefined) conditions.push(Prisma.sql`p.user_id = ${userId}`);

  const rows = await prisma.$queryRaw<{ median_seconds: number | null; sample: number }[]>`
    SELECT
      percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (p.resolved_at - p.created_at))::double precision
      ) AS median_seconds,
      COUNT(*)::int AS sample
    FROM posts p
    WHERE ${Prisma.join(conditions, " AND ")}
  `;

  const row = rows[0];
  if (!row || row.median_seconds === null) {
    return { medianHours: null, sampleSize: row?.sample ?? 0 };
  }

  return { medianHours: row.median_seconds / 3600, sampleSize: row.sample };
}

/**
 * The whole report picture for one scope: the site when `userId` is absent, one
 * person's reports when it is present. Everything the statistics page shows.
 */
export async function buildReportStatistics(userId?: bigint): Promise<ReportStatistics> {
  const where = scopeWhere(userId);

  const [
    total,
    statusGroups,
    priorityGroups,
    categoryGroups,
    wardGroups,
    engagement,
    dates,
    resolution,
  ] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.post.groupBy({ by: ["priority"], where, _count: { _all: true } }),
    prisma.post.groupBy({ by: ["categoryId"], where, _count: { _all: true } }),
    prisma.post.groupBy({ by: ["wardId", "status"], where, _count: { _all: true } }),
    prisma.post.aggregate({
      where,
      _sum: { likeCount: true, commentCount: true, viewCount: true },
    }),
    prisma.post.aggregate({ where, _min: { createdAt: true }, _max: { createdAt: true } }),
    resolutionStatistics(userId),
  ]);

  const statusCounts = new Map(statusGroups.map((group) => [group.status, group._count._all]));

  const priorityCounts = new Map(
    priorityGroups.map((group) => [group.priority, group._count._all]),
  );

  const [categories, wards] = await Promise.all([
    prisma.category.findMany({
      where: { id: { in: categoryGroups.map((group) => group.categoryId) } },
      select: { id: true, name: true },
    }),
    prisma.ward.findMany({
      where: { id: { in: [...new Set(wardGroups.map((group) => group.wardId))] } },
      select: { id: true, name: true },
    }),
  ]);

  const categoryNames = new Map(categories.map((category) => [category.id.toString(), category.name]));
  const wardNames = new Map(wards.map((ward) => [ward.id.toString(), ward.name]));

  // Descending by count, then alphabetical, so equal counts do not reorder.
  const byCategory = categoryGroups
    .map((group) => ({
      label: categoryNames.get(group.categoryId.toString()) ?? "Unknown",
      count: group._count._all,
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

  const byWardRows = new Map<string, WardBreakdown>();
  for (const group of wardGroups) {
    const key = group.wardId.toString();
    const row = byWardRows.get(key) ?? {
      ward: wardNames.get(key) ?? "Unknown",
      total: 0,
      pending: 0,
      inProgress: 0,
      resolved: 0,
      rejected: 0,
    };

    row.total += group._count._all;
    if (group.status === "pending") row.pending += group._count._all;
    else if (group.status === "in_progress") row.inProgress += group._count._all;
    else if (group.status === "resolved") row.resolved += group._count._all;
    else row.rejected += group._count._all;

    byWardRows.set(key, row);
  }

  const byWard = [...byWardRows.values()].sort(
    (a, b) => b.total - a.total || a.ward.localeCompare(b.ward),
  );

  const resolved = statusCounts.get("resolved") ?? 0;
  const rejected = statusCounts.get("rejected") ?? 0;

  return {
    total,
    // Open means still needing work. Rejected is closed, not open, which is why
    // this is not simply total - resolved.
    open: total - resolved - rejected,
    resolved,
    resolutionRate: total === 0 ? 0 : Number(((resolved / total) * 100).toFixed(1)),

    byStatus: STATUS_ORDER.map((status) => ({ status, count: statusCounts.get(status) ?? 0 })),
    byPriority: PRIORITY_ORDER.map((priority) => ({
      label: PRIORITY_LABEL[priority],
      count: priorityGroups.find((group) => group.priority === priority)?._count._all ?? 0,
    })),
    byCategory,
    byWard,

    upvotes: engagement._sum.likeCount ?? 0,
    comments: engagement._sum.commentCount ?? 0,
    views: engagement._sum.viewCount ?? 0,

    medianResolutionHours: resolution.medianHours,
    resolutionSampleSize: resolution.sampleSize,

    firstReportDate: dates._min.createdAt?.toISOString() ?? null,
    latestReportDate: dates._max.createdAt?.toISOString() ?? null,
  };
}

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/**
 * The landing page's "Community Activity" panel: this year's totals, the month
 * just gone, and the posts-per-month bars.
 *
 * Month boundaries are UTC. The database stores `timestamptz`, so a report filed
 * late on the 31st belongs to whichever UTC month it falls in, consistently for
 * everyone — a per-viewer timezone would make the same bar chart disagree with
 * itself between two readers.
 */
export async function getActivitySummary(now: Date = new Date()): Promise<ActivitySummary> {
  const year = now.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year + 1, 0, 1));
  const thisMonthStart = startOfMonthUTC(now);
  const lastMonthStart = new Date(Date.UTC(year, now.getUTCMonth() - 1, 1));

  const yearWhere: Prisma.PostWhereInput = {
    deletedAt: null,
    createdAt: { gte: yearStart, lt: yearEnd },
  };

  // Twelve counted buckets rather than one query per row returned. Each is an
  // index range scan, so the panel stays a fixed handful of cheap queries no
  // matter how many reports the year holds.
  const monthStarts = MONTH_LABELS.map((_, index) => new Date(Date.UTC(year, index, 1)));

  const [comments, authors, lastMonth, ...monthCounts] = await Promise.all([
    prisma.post.aggregate({ where: yearWhere, _sum: { commentCount: true } }),
    prisma.post.findMany({ where: yearWhere, select: { userId: true }, distinct: ["userId"] }),
    prisma.post.count({
      where: { deletedAt: null, createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
    }),
    ...monthStarts.map((start, index) =>
      prisma.post.count({
        where: {
          deletedAt: null,
          createdAt: { gte: start, lt: index === 11 ? yearEnd : monthStarts[index + 1]! },
        },
      }),
    ),
  ]);

  const monthly = MONTH_LABELS.map((month, index) => ({ month, count: monthCounts[index] ?? 0 }));
  const reports = monthCounts.reduce((sum, count) => sum + count, 0);
  const reportsThisMonth = monthCounts[now.getUTCMonth()] ?? 0;

  return {
    year,
    reports,
    comments: comments._sum.commentCount ?? 0,
    activeUsers: authors.length,
    reportsThisMonth,
    reportsLastMonth: lastMonth,
    // A percentage needs something to be a percentage of. With no reports the
    // month before, "up 100%" would be noise, so it is null and the client shows
    // no badge rather than a made-up one.
    reportsChangePercent:
      lastMonth === 0 ? null : Number((((reportsThisMonth - lastMonth) / lastMonth) * 100).toFixed(1)),
    monthly,
  };
}

/**
 * Everything the admin dashboard opens on: the live report picture, what has
 * been moderated away, who is on the platform, the contact inbox, and the year's
 * activity. One request so the overview does not fan out into five.
 */
export async function getAdminOverview(now: Date = new Date()): Promise<AdminOverview> {
  const [stats, activity, deleted, total, superAdmins, newThisMonth, messages, unhandled] =
    await Promise.all([
      buildReportStatistics(),
      getActivitySummary(now),
      prisma.post.count({ where: { deletedAt: { not: null } } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: "super_admin" } }),
      prisma.user.count({ where: { createdAt: { gte: startOfMonthUTC(now) } } }),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { handledAt: null } }),
    ]);

  return {
    stats,
    moderation: { deleted },
    users: { total, superAdmins, newThisMonth },
    contactMessages: { total, unhandled },
    activity,
  };
}
