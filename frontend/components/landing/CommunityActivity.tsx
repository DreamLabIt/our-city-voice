"use client";

import React from "react";
import { stats, chartMonths, yTicks } from "@/data/mock-data";
import type { StatItem, ChartMonth } from "@/types";

export default function CommunityActivity(): React.ReactNode {

    return (
        <div className="w-full bg-card rounded-2xl border border-border-custom p-5 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                <div className="lg:col-span-7 space-y-3">
                    <h2 className="text-base font-bold text-foreground">Community Activity</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {stats.map((item: StatItem, idx: number) => {
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
                        Posts per Month <span className="text-xs font-normal text-muted-foreground">(This Year)</span>
                    </h2>

                    <div className="relative pt-2">
                        <div className="h-32 flex items-stretch">

                            <div className="flex flex-col justify-between text-[10px] text-muted-foreground font-medium pr-2 text-right shrink-0">
                                {yTicks.map((tick: number) => (
                                    <span key={tick} className="leading-none">{tick}</span>
                                ))}
                            </div>

                            <div className="flex-1 relative flex flex-col justify-between">

                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {yTicks.map((_: number, i: number) => (
                                        <div key={i} className="w-full border-b border-border-custom/60" />
                                    ))}
                                </div>

                                <div className="absolute inset-0 flex items-end justify-between gap-1 pl-1">
                                    {chartMonths.map((m: ChartMonth, i: number) => (
                                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group z-10">
                                            <div
                                                className="w-full max-w-4.5 bg-secondary hover:bg-primary rounded-t-sm transition-all"
                                                style={{ height: `${(m.val / 200) * 100}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                        <div className="flex justify-between pl-6 mt-1.5">
                            {chartMonths.map((m: ChartMonth, i: number) => (
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