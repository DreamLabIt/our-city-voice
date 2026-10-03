import type {
    CivicReport,
    CountRow,
    PlatformStatistics,
    PostItem,
    ReportStatus,
    ReportSummary,
    StatusCount,
    WardBreakdown,
} from "@/types";

/**
 * Counts the statistics page from the reports themselves.
 *
 * The page used to hold its own totals, which drifted: it claimed 15,420
 * reports against 13 real ones, and its category chart still named categories
 * that had been renamed. Deriving everything here means a figure cannot be
 * wrong without the underlying report being wrong too.
 *
 * Same reducer will work on API rows. Only the two adapters below know which
 * fixture shape they came from.
 */

/** The order a reader expects, not the order the data happens to arrive in. */
export const STATUS_ORDER: ReportStatus[] = ["Pending", "In Progress", "Resolved", "Rejected"];
const PRIORITY_ORDER = ["Critical", "High", "Medium", "Low"] as const;

/**
 * Handles both fixture date shapes: "Oct 26, 2026" on posts, "2026-09-28" on
 * reports, and "Oct 26, 2026 · 08:14" inside timelines.
 */
function parseDate(value: string): Date | null {
    const cleaned = value.replace("·", " ").replace(/\s+/g, " ").trim();
    const parsed = new Date(cleaned);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Hours from the first timeline entry to the one that resolved the report.
 * Null when the report never reached Resolved, or when either date is
 * unparseable, so a bad string cannot turn into a fake duration.
 */
function resolutionHours(post: PostItem): number | null {
    if (post.updates.length === 0) return null;

    const resolved = [...post.updates].reverse().find((u) => u.status === "Resolved");
    if (!resolved) return null;

    const start = parseDate(post.updates[0]!.date);
    const end = parseDate(resolved.date);
    if (!start || !end) return null;

    const hours = (end.getTime() - start.getTime()) / 3_600_000;
    return hours >= 0 ? hours : null;
}

export function summarisePost(post: PostItem): ReportSummary {
    return {
        id: post.id,
        code: post.code,
        title: post.title,
        status: post.status,
        priority: post.priority,
        category: post.tag,
        ward: post.ward,
        department: post.department,
        date: parseDate(post.date) ?? new Date(0),
        upvotes: post.likes,
        comments: post.comments,
        views: post.views,
        resolutionHours: resolutionHours(post),
    };
}

export function summariseReport(report: CivicReport): ReportSummary {
    return {
        id: report.id,
        code: report.trackingId,
        title: report.title,
        status: report.status,
        priority: report.priority,
        category: report.category,
        ward: report.ward,
        department: report.department,
        date: parseDate(report.date) ?? new Date(0),
        upvotes: report.upvotes,
        comments: report.commentsCount,
        views: report.views,
        // This fixture set has no status timeline, so it cannot contribute to
        // the resolution-time median. Counting it as zero hours would drag the
        // median toward a number nothing measured.
        resolutionHours: null,
    };
}

/** Descending by count, then alphabetical, so equal counts do not reorder. */
function toSortedCounts(values: string[]): CountRow[] {
    const counts = new Map<string, number>();
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);

    return [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function median(values: number[]): number | null {
    if (values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    return sorted.length % 2 === 0
        ? (sorted[mid - 1]! + sorted[mid]!) / 2
        : sorted[mid]!;
}

export function buildStatistics(reports: ReportSummary[]): PlatformStatistics {
    const total = reports.length;
    const countOf = (status: ReportStatus) =>
        reports.filter((r) => r.status === status).length;

    const resolved = countOf("Resolved");
    const rejected = countOf("Rejected");

    const byWard = new Map<string, WardBreakdown>();
    for (const report of reports) {
        const row = byWard.get(report.ward) ?? {
            ward: report.ward,
            total: 0,
            pending: 0,
            inProgress: 0,
            resolved: 0,
            rejected: 0,
        };
        row.total += 1;
        if (report.status === "Pending") row.pending += 1;
        else if (report.status === "In Progress") row.inProgress += 1;
        else if (report.status === "Resolved") row.resolved += 1;
        else row.rejected += 1;
        byWard.set(report.ward, row);
    }

    const resolutionTimes = reports
        .map((r) => r.resolutionHours)
        .filter((hours): hours is number => hours !== null);

    const dates = reports.map((r) => r.date.getTime()).filter((t) => t > 0);

    const priorityCounts = toSortedCounts(reports.map((r) => r.priority));

    return {
        total,
        // Open means still needing work. Rejected is closed, not open, which
        // is why this is not simply total - resolved.
        open: total - resolved - rejected,
        resolved,
        resolutionRate: total === 0 ? 0 : Number(((resolved / total) * 100).toFixed(1)),

        byStatus: STATUS_ORDER.map<StatusCount>((status) => ({
            status,
            count: countOf(status),
        })),
        // Severity order, not frequency order: a reader scanning priorities
        // wants Critical first whether or not it is the biggest bucket.
        byPriority: PRIORITY_ORDER.map((label) => ({
            label,
            count: priorityCounts.find((p) => p.label === label)?.count ?? 0,
        })),
        byCategory: toSortedCounts(reports.map((r) => r.category)),
        byWard: [...byWard.values()].sort(
            (a, b) => b.total - a.total || a.ward.localeCompare(b.ward),
        ),

        upvotes: reports.reduce((sum, r) => sum + r.upvotes, 0),
        comments: reports.reduce((sum, r) => sum + r.comments, 0),
        views: reports.reduce((sum, r) => sum + r.views, 0),

        medianResolutionHours: median(resolutionTimes),
        resolutionSampleSize: resolutionTimes.length,

        firstReportDate: dates.length ? new Date(Math.min(...dates)) : null,
        latestReportDate: dates.length ? new Date(Math.max(...dates)) : null,
    };
}
