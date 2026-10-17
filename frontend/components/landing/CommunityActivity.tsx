"use client";

import React, { useMemo } from "react";
import { stats as mockStats, chartMonths as mockChartMonths, yTicks as mockYTicks } from "@/data/mock-data";
import type { StatItem, ChartMonth, CommunityActivityProps } from "@/types";

export default function CommunityActivity({ activityData }: CommunityActivityProps): React.ReactNode {
    const reports = activityData?.reports;
    const comments = activityData?.comments;
    const activeUsers = activityData?.activeUsers;
    const monthly = activityData?.monthly ?? [];
    const changePercent = activityData?.reportsChangePercent;
    const currentYear = activityData?.year ?? new Date().getFullYear();
    const displayStats = useMemo<StatItem[]>(() => {
        if (!activityData) return mockStats;

        return mockStats.map((item, idx) => {
            if (idx === 0) {
                return {
                    ...item,
                    value: reports?.toLocaleString() ?? "0",
                    badge: changePercent !== null && changePercent !== undefined
                        ? `${changePercent >= 0 ? "+" : ""}${changePercent}%`
                        : undefined,
                    sub: changePercent !== null && changePercent !== undefined
                        ? "vs last month"
                        : item.sub,
                };
            }
            if (idx === 1) {
                return {
                    ...item,
                    value: comments?.toLocaleString() ?? "0",
                };
            }
            if (idx === 2) {
                return {
                    ...item,
                    value: activeUsers?.toLocaleString() ?? "0",
                };
            }
            if (idx === 3) {
                return {
                    ...item,
                    value: String(currentYear),
                };
            }
            return item;
        });
    }, [activityData, reports, comments, activeUsers, changePercent, currentYear]);

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
        const highestCount = Math.max(...counts, 10);
        const ceilingMax = Math.ceil(highestCount / 10) * 10 || 10;

        const ticks = [
            ceilingMax,
            Math.round(ceilingMax * 0.75),
            Math.round(ceilingMax * 0.5),
            Math.round(ceilingMax * 0.25),
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
                        {displayStats.map((item: StatItem, idx: number) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className={`${item.cardBg} rounded-2xl p-3.5 border border-border-custom/50 flex items-start gap-3.5 h-30 relative pt-4`}
                                >
                                    <div className={`w-12 h-12 rounded-full ${item.circleBg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-6 h-6 ${item.iconColor} fill-current`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className={`text-xl font-extrabold ${item.valueColor} leading-none block`}>
                                            {item.value}
                                        </span>
                                        <p className="text-[10px] font-semibold text-foreground/80 mt-1 leading-tight truncate">
                                            {item.title}
                                        </p>

                                        {item.badge ? (
                                            <div className="mt-1">
                                                <span className="text-[11px] font-bold text-tag-green-text block leading-tight">
                                                    {item.badge}
                                                </span>
                                                <p className="text-[9px] text-muted-foreground leading-tight">{item.sub}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-muted-foreground mt-0.5">{item.sub}</p>
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