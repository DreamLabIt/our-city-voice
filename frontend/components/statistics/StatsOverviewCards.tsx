import React from "react";
import { CheckCircle2, Clock, FileText, Timer } from "lucide-react";
import { StatsOverviewCardsProps } from "@/types/statistics";

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
        <div className="bg-card border border-border-custom rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                </span>
                <Icon className="w-8 h-8 text-muted-foreground shrink-0" />
            </div>
            <p className="text-3xl font-semibold text-primary tabular-nums text-center">{value}</p>
            <p className="text-xs text-muted-foreground text-center">{note}</p>
        </div>
    );
}

export default function StatsOverviewCards({ stats }: StatsOverviewCardsProps) {
    const medianNote =
        stats.medianResolutionHours === null
            ? "No resolved report carries a timeline yet"
            : `Median across ${stats.resolutionSampleSize} report${stats.resolutionSampleSize === 1 ? "" : "s"
            } with a full timeline`;

    return (
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
    );
}