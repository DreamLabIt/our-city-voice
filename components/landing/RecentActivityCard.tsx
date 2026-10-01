"use client";

import React from "react";
import { Clock } from "lucide-react";
import { activities } from "@/data/mock-data";
import type { ActivityItem } from "@/types";

export default function RecentActivityCard(): React.ReactNode {

    return (
        <div className="w-full bg-section rounded-2xl border border-border-custom shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-0 p-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-base">
                    <Clock className="w-5 h-5 text-foreground" />
                    <span>Recent Activity</span>
                </div>
                <button
                    type="button"
                    className="text-md font-semibold text-primary hover:underline cursor-pointer"
                >
                    View All
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border-custom/60 divide-y divide-border-custom/60 overflow-hidden shadow-2xs pr-1">
                {activities.map((item: ActivityItem) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 gap-2 hover:bg-section/60 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}
                                >
                                    <Icon className={`w-4 h-4 ${item.iconColor} fill-current`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-foreground text-[17px] leading-tight truncate">
                                        {item.title}
                                    </p>
                                    <p className="text-[15px] text-muted font-normal leading-tight mt-0.5">
                                        {item.code}
                                    </p>
                                </div>
                            </div>

                            <span className="text-[14px] text-muted font-medium shrink-0 self-start pt-0.5">
                                {item.time}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}