import React from "react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import { CheckCircle2, Clock, FileText, Timer } from "lucide-react";

import { initialReports, posts } from "@/data/mock-data";
import { buildStatistics, summarisePost, summariseReport, STATUS_ORDER } from "@/lib/statistics";
import { STATUS_META } from "@/lib/status";

// Counted at build time. Nothing on this page is a stored total, so there is
// no state to refresh and no time-range control: the figures are whatever the
// published reports add up to.
const stats = buildStatistics([
    ...posts.map(summarisePost),
    ...initialReports.map(summariseReport),
]);

const dateFormat = new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

function Figure({
    label,
    value,
    note,
    icon: Icon,
}: {
    label: string;
    value: string;
    note: string;
    icon: React.ElementType;
}) {
    return (
        <div className="bg-card border border-border-custom rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                </span>
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
            </div>
            <p className="text-3xl font-semibold text-foreground tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground">{note}</p>
        </div>
    );
}

/**
 * A row of the count bars. One hue, because the job is comparing magnitude
 * rather than telling series apart, and the label already carries identity.
 */
function CountBar({
    label,
    count,
    max,
    fill = "bg-primary",
}: {
    label: React.ReactNode;
    count: number;
    max: number;
    fill?: string;
}) {
    const width = max === 0 ? 0 : (count / max) * 100;

    return (
        <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="text-foreground min-w-0 truncate">{label}</span>
                <span className="text-muted-foreground tabular-nums shrink-0">{count}</span>
            </div>
            <div className="h-1.5 w-full bg-section rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${fill}`} style={{ width: `${width}%` }} />
            </div>
        </div>
    );
}

function Panel({
    title,
    description,
    children,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <section className="bg-card border border-border-custom rounded-xl p-5 sm:p-6 space-y-5">
            <div className="space-y-1">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {children}
        </section>
    );
}

export default function StatisticsPage(): React.ReactNode {
    const { firstReportDate, latestReportDate } = stats;
    const span =
        firstReportDate && latestReportDate
            ? `${dateFormat.format(firstReportDate)} to ${dateFormat.format(latestReportDate)}`
            : "no reports published yet";

    const categoryMax = Math.max(0, ...stats.byCategory.map((c) => c.count));
    const priorityMax = Math.max(0, ...stats.byPriority.map((p) => p.count));
    const statusMax = Math.max(0, ...stats.byStatus.map((s) => s.count));

    const medianNote =
        stats.medianResolutionHours === null
            ? "No resolved report carries a timeline yet"
            : `Median across ${stats.resolutionSampleSize} report${stats.resolutionSampleSize === 1 ? "" : "s"} with a full timeline`;

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Platform Statistics"
                description="How many issues residents have reported, where they are, and how many have been resolved."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Statistics"
            />

            <SectionContainer>
                <div className="py-10 space-y-6">
                    <p className="text-xs text-muted-foreground">
                        Counted from the {stats.total} reports currently published, {span}.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Figure
                            label="Total reports"
                            value={stats.total.toLocaleString()}
                            note={`Across ${stats.byWard.length} wards and ${stats.byCategory.length} categories`}
                            icon={FileText}
                        />
                        <Figure
                            label="Resolved"
                            value={stats.resolved.toLocaleString()}
                            note={`${stats.resolutionRate}% of all reports`}
                            icon={CheckCircle2}
                        />
                        <Figure
                            label="Still open"
                            value={stats.open.toLocaleString()}
                            note="Pending triage or with a crew"
                            icon={Clock}
                        />
                        <Figure
                            label="Time to resolve"
                            value={
                                stats.medianResolutionHours === null
                                    ? "—"
                                    : `${stats.medianResolutionHours.toFixed(0)}h`
                            }
                            note={medianNote}
                            icon={Timer}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Panel
                            title="By category"
                            description="What residents are reporting, most reported first."
                        >
                            <div className="space-y-4 max-h-50 overflow-y-scroll">
                                {stats.byCategory.map((row) => (
                                    <CountBar
                                        key={row.label}
                                        label={row.label}
                                        count={row.count}
                                        max={categoryMax}
                                    />
                                ))}
                            </div>
                        </Panel>
                        <Panel
                            title="By status"
                            description="Every report sits in exactly one of these."
                        >
                            <div className="space-y-4">
                                {STATUS_ORDER.map((status) => {
                                    const meta = STATUS_META[status];
                                    const Icon = meta.icon;
                                    const count =
                                        stats.byStatus.find((s) => s.status === status)?.count ?? 0;

                                    return (
                                        <CountBar
                                            key={status}
                                            label={
                                                <span className="flex items-center gap-1.5">
                                                    <Icon
                                                        className={`w-3.5 h-3.5 shrink-0 ${meta.text}`}
                                                    />
                                                    {status}
                                                </span>
                                            }
                                            count={count}
                                            max={statusMax}
                                            fill={meta.fill}
                                        />
                                    );
                                })}
                            </div>
                        </Panel>

                        <Panel
                            title="By priority"
                            description="Assigned at triage, most severe first."
                        >
                            <div className="space-y-4">
                                {stats.byPriority.map((row) => (
                                    <CountBar
                                        key={row.label}
                                        label={row.label}
                                        count={row.count}
                                        max={priorityMax}
                                    />
                                ))}
                            </div>
                        </Panel>
                    </div>

                    <Panel title="By ward" description="Report status broken down by ward.">
                        <div className="overflow-x-auto -mx-5 sm:-mx-6">
                            <table className="w-full text-sm border-collapse">
                                <thead>
                                    <tr className="text-xs text-muted-foreground uppercase tracking-wide border-b border-border-custom">
                                        <th className="text-left font-semibold py-2.5 px-5 sm:px-6">
                                            Ward
                                        </th>
                                        <th className="text-right font-semibold py-2.5 px-3">
                                            Total
                                        </th>
                                        <th className="text-right font-semibold py-2.5 px-3">
                                            Pending
                                        </th>
                                        <th className="text-right font-semibold py-2.5 px-3">
                                            In progress
                                        </th>
                                        <th className="text-right font-semibold py-2.5 px-5 sm:px-6">
                                            Resolved
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border-custom/60">
                                    {stats.byWard.map((row) => (
                                        <tr key={row.ward}>
                                            <td className="py-2.5 px-5 sm:px-6 text-foreground">
                                                {row.ward}
                                            </td>
                                            <td className="py-2.5 px-3 text-right tabular-nums text-foreground">
                                                {row.total}
                                            </td>
                                            <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                                                {row.pending || "—"}
                                            </td>
                                            <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground">
                                                {row.inProgress || "—"}
                                            </td>
                                            <td className="py-2.5 px-5 sm:px-6 text-right tabular-nums text-muted-foreground">
                                                {row.resolved || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>

                    <Panel title="Community response" description="Totals across every report.">
                        <dl className="grid grid-cols-3 gap-4">
                            {[
                                { label: "Upvotes", value: stats.upvotes },
                                { label: "Comments", value: stats.comments },
                                { label: "Views", value: stats.views },
                            ].map((item) => (
                                <div key={item.label} className="space-y-1">
                                    <dt className="text-xs text-muted-foreground">{item.label}</dt>
                                    <dd className="text-xl font-semibold text-foreground tabular-nums">
                                        {item.value.toLocaleString()}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </Panel>
                </div>
            </SectionContainer>
        </section>
    );
}
