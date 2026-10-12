import type { Priority, Report, ReportStatus } from "@/types/report";
import type { CountRow, PlatformStatistics, StatusCount, WardBreakdown } from "@/types";

/**
 * Counts the statistics page from the reports themselves.
 *
 * The page used to hold its own totals, which drifted: it claimed 15,420
 * reports against 13 real ones, and its category chart still named categories
 * that had been renamed. Deriving everything here means a figure cannot be
 * wrong without the underlying report being wrong too.
 *
 * The reducer takes the schema-faithful `Report` shape, so it works unchanged
 * on mock data and on API rows.
 */

/** The order a reader expects, not the order the data happens to arrive in. */
export const STATUS_ORDER: ReportStatus[] = ["pending", "in_progress", "resolved", "rejected"];
const PRIORITY_ORDER = ["critical", "high", "medium", "low"] as const;

/** Written labels for the post_priority enum values. */
const PRIORITY_LABEL: Record<Priority, string> = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
};

/**
 * Hours from `createdAt` to `resolvedAt`. Null unless the report is resolved
 * and both columns are present, so a missing date cannot turn into a fake
 * duration. The report fixtures carry no `resolvedAt`, so they cannot drag the
 * median toward a number nothing measured.
 */
function resolutionHours(report: Report): number | null {
    if (report.status !== "resolved") return null;

    const start = new Date(report.createdAt).getTime();
    const end = report.resolvedAt === null ? NaN : new Date(report.resolvedAt).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) return null;

    const hours = (end - start) / 3_600_000;
    return hours >= 0 ? hours : null;
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

export function buildStatistics(reports: Report[]): PlatformStatistics {
    const total = reports.length;
    const countOf = (status: ReportStatus) =>
        reports.filter((r) => r.status === status).length;

    const resolved = countOf("resolved");
    const rejected = countOf("rejected");

    const byWard = new Map<string, WardBreakdown>();
    for (const report of reports) {
        const ward = report.ward.name;
        const row = byWard.get(ward) ?? {
            ward,
            total: 0,
            pending: 0,
            inProgress: 0,
            resolved: 0,
            rejected: 0,
        };
        row.total += 1;
        if (report.status === "pending") row.pending += 1;
        else if (report.status === "in_progress") row.inProgress += 1;
        else if (report.status === "resolved") row.resolved += 1;
        else row.rejected += 1;
        byWard.set(ward, row);
    }

    const resolutionTimes = reports
        .map(resolutionHours)
        .filter((hours): hours is number => hours !== null);

    const dates = reports
        .map((r) => new Date(r.createdAt).getTime())
        .filter((t) => !Number.isNaN(t) && t > 0);

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
        byPriority: PRIORITY_ORDER.map((value) => ({
            label: PRIORITY_LABEL[value],
            count: priorityCounts.find((p) => p.label === value)?.count ?? 0,
        })),
        byCategory: toSortedCounts(reports.map((r) => r.category.name)),
        byWard: [...byWard.values()].sort(
            (a, b) => b.total - a.total || a.ward.localeCompare(b.ward),
        ),

        upvotes: reports.reduce((sum, r) => sum + r.likeCount, 0),
        comments: reports.reduce((sum, r) => sum + r.commentCount, 0),
        views: reports.reduce((sum, r) => sum + r.viewCount, 0),

        medianResolutionHours: median(resolutionTimes),
        resolutionSampleSize: resolutionTimes.length,

        firstReportDate: dates.length ? new Date(Math.min(...dates)) : null,
        latestReportDate: dates.length ? new Date(Math.max(...dates)) : null,
    };
}