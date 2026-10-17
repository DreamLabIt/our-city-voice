"use client";

import React, { useMemo } from "react";
import { MessageSquare, FileText, Users, Calendar, ArrowUp, ArrowDown } from "lucide-react";
import { stats as mockStats, chartMonths as mockChartMonths, yTicks as mockYTicks } from "@/data/mock-data";
import type { ChartMonth, CommunityActivityProps } from "@/types";
import { DisplayStatItem } from "@/types/statistics";

export default function CommunityActivity({ activityData }: CommunityActivityProps): React.ReactNode {
    const reports = activityData?.reports;
    const comments = activityData?.comments;
    const activeUsers = activityData?.activeUsers;
    const reportsThisMonth = activityData?.reportsThisMonth;
    const reportsLastMonth = activityData?.reportsLastMonth;
    const monthly = activityData?.monthly ?? [];
    const changePercent = activityData?.reportsChangePercent;
    const currentYear = activityData?.year ?? new Date().getFullYear();

    const currentMonthLabel = useMemo<string>(() => {
        const utcMonthIndex = new Date().getUTCMonth();
        return (
            monthly[utcMonthIndex]?.month ??
            new Intl.DateTimeFormat("en-US", {
                month: "short",
                timeZone: "UTC",
            }).format(new Date())
        );
    }, [monthly]);

    const displayStats = useMemo<DisplayStatItem[]>(() => {
        if (!activityData) {
            return mockStats.map((item) => ({
                ...item,
                sub: currentMonthLabel,
                icon: item.icon,
            }));
        }

        const hasChange = changePercent !== null && changePercent !== undefined;

        return [
            {
                title: "Total Posts",
                value: (reports ?? 0).toLocaleString(),
                sub: currentMonthLabel,
                cardBg: "bg-blue-50/50 dark:bg-blue-950/20",
                circleBg: "bg-blue-100 dark:bg-blue-900/40",
                iconColor: "text-blue-600 dark:text-blue-400",
                valueColor: "text-blue-950 dark:text-blue-100",
                icon: MessageSquare,
            },
            {
                title: "Comments",
                value: (comments ?? 0).toLocaleString(),
                sub: currentMonthLabel,
                cardBg: "bg-emerald-50/50 dark:bg-emerald-950/20",
                circleBg: "bg-emerald-100 dark:bg-emerald-900/40",
                iconColor: "text-emerald-600 dark:text-emerald-400",
                valueColor: "text-emerald-950 dark:text-emerald-100",
                icon: FileText,
            },
            {
                title: "Active Users",
                value: (activeUsers ?? 0).toLocaleString(),
                sub: currentMonthLabel,
                cardBg: "bg-amber-50/50 dark:bg-amber-950/20",
                circleBg: "bg-amber-100 dark:bg-amber-900/40",
                iconColor: "text-amber-600 dark:text-amber-400",
                valueColor: "text-amber-950 dark:text-amber-100",
                icon: Users,
            },
            {
                title: "Posts This Month",
                value: (reportsThisMonth ?? 0).toLocaleString(),
                sub: hasChange ? `vs. Last Month (${reportsLastMonth ?? 0})` : currentMonthLabel,
                badge: hasChange ? `${Math.abs(changePercent)}%` : undefined,
                isNegative: hasChange && changePercent < 0,
                cardBg: "bg-purple-50/50 dark:bg-purple-950/20",
                circleBg: "bg-purple-100 dark:bg-purple-900/40",
                iconColor: "text-purple-600 dark:text-purple-400",
                valueColor: "text-purple-950 dark:text-purple-100",
                icon: Calendar,
            },
        ];
    }, [
        activityData,
        reports,
        comments,
        activeUsers,
        reportsThisMonth,
        reportsLastMonth,
        changePercent,
        currentMonthLabel,
    ]);

    const { chartData, calculatedYTicks, maxVal } = useMemo(() => {
        if (!monthly || monthly.length === 0) {
            return {
                chartData: mockChartMonths,
                calculatedYTicks: mockYTicks,
                maxVal: 200,
            };
        }

        const mappedChart: ChartMonth[] = monthly.map((m) => ({
            month: m.month,
            val: m.count,
        }));

        const counts = monthly.map((m) => m.count);
        const highestCount = Math.max(...counts, 8);
        const ceilingMax = Math.ceil(highestCount / 4) * 4 || 4;

        const ticks = [
            ceilingMax,
            (ceilingMax * 3) / 4,
            ceilingMax / 2,
            ceilingMax / 4,
            0,
        ];

        return {
            chartData: mappedChart,
            calculatedYTicks: ticks,
            maxVal: ceilingMax,
        };
    }, [monthly]);

    return (
        <div className="w-full bg-card rounded-2xl border border-border-custom p-5 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                <div className="lg:col-span-7 space-y-3">
                    <h2 className="text-base font-bold text-foreground">Community Activity</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {displayStats.map((item: DisplayStatItem, idx: number) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className={`${item.cardBg} rounded-2xl p-4 border border-border-custom/40 flex items-start gap-3.5 h-28 relative`}
                                >
                                    <div className={`w-12 h-12 rounded-full ${item.circleBg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-6 h-6 ${item.iconColor}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className={`text-2xl font-extrabold ${item.valueColor} leading-tight block`}>
                                            {item.value}
                                        </span>
                                        <p className="text-xs font-bold text-foreground/80 mt-0.5 leading-tight truncate">
                                            {item.title}
                                        </p>

                                        {item.badge ? (
                                            <div className="mt-1">
                                                <div className={`flex items-center gap-0.5 text-xs font-bold ${item.isNegative ? "text-destructive" : "text-emerald-600 dark:text-emerald-400"}`}>
                                                    {item.isNegative ? (
                                                        <ArrowDown className="w-3.5 h-3.5 stroke-3" />
                                                    ) : (
                                                        <ArrowUp className="w-3.5 h-3.5 stroke-3" />
                                                    )}
                                                    <span>{item.badge}</span>
                                                </div>
                                                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{item.sub}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">This Year</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-border-custom pt-4 lg:pt-0 lg:pl-6 space-y-2">
                    <h2 className="text-base font-bold text-foreground">
                        Posts per Month <span className="text-xs font-normal text-muted-foreground">({currentYear})</span>
                    </h2>

                    <div className="relative pt-2">
                        <div className="h-32 flex items-stretch">

                            <div className="flex flex-col justify-between text-[10px] text-muted-foreground font-medium pr-2 text-right shrink-0">
                                {calculatedYTicks.map((tick: number, i: number) => (
                                    <span key={i} className="leading-none">{tick}</span>
                                ))}
                            </div>

                            <div className="flex-1 relative flex flex-col justify-between">

                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {calculatedYTicks.map((_: number, i: number) => (
                                        <div key={i} className="w-full border-b border-border-custom/60" />
                                    ))}
                                </div>

                                <div className="absolute inset-0 flex items-end justify-between gap-1 pl-1">
                                    {chartData.map((m: ChartMonth, i: number) => {
                                        const heightPercent = maxVal > 0 ? (m.val / maxVal) * 100 : 0;

                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 flex flex-col items-center h-full justify-end group z-10"
                                                title={`${m.month}: ${m.val} posts`}
                                            >
                                                <div
                                                    className="w-full max-w-4.5 bg-secondary hover:bg-primary rounded-t-sm transition-all"
                                                    style={{ height: `${Math.min(100, Math.max(heightPercent, 2))}%` }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        </div>

                        <div className="flex justify-between pl-6 mt-1.5">
                            {chartData.map((m: ChartMonth, i: number) => (
                                <span key={i} className="flex-1 text-center text-[10px] text-muted-foreground font-medium">
                                    {m.month}
                                </span>
                            ))}
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
}