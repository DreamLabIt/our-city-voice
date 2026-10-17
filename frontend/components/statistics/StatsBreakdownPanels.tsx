import React from "react";
import { STATUS_ORDER } from "@/lib/statistics";
import { STATUS_META } from "@/lib/status";
import { StatsBreakdownPanelsProps } from "@/types/statistics";

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
                <span className="text-muted-foreground text-lg tabular-nums shrink-0">{count}</span>
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
        <section className="bg-card border border-border-custom rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
            <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
            {children}
        </section>
    );
}

export default function StatsBreakdownPanels({ stats }: StatsBreakdownPanelsProps) {
    const categoryMax = Math.max(0, ...stats.byCategory.map((c) => c.count));
    const priorityMax = Math.max(0, ...stats.byPriority.map((p) => p.count));
    const statusMax = Math.max(0, ...stats.byStatus.map((s) => s.count));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel
                title="By category"
                description="What residents are reporting, most reported first."
            >
                <div className="space-y-4 max-h-50 overflow-y-auto no-scrollbar">
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

            <Panel title="By status" description="Every report sits in exactly one of these.">
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
                                        <Icon className={`w-3.5 h-3.5 shrink-0 ${meta.text}`} />
                                        {meta.label}
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

            <Panel title="By priority" description="Assigned at triage, most severe first.">
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
    );
}