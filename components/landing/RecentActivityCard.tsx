"use client";

import React from "react";
import {
    Clock,
    Road,
    Building2,
    Leaf,
    Lightbulb,
    Droplet,
    LucideIcon,
} from "lucide-react";

interface ActivityItem {
    id: string;
    title: string;
    code: string;
    time: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
}

export default function RecentActivityCard(): React.JSX.Element {
    const activities: ActivityItem[] = [
        {
            id: "1",
            title: "New post on Roads",
            code: "#2024-001245",
            time: "5 min ago",
            icon: Road,
            iconBg: "bg-[#e0f2fe]",
            iconColor: "text-[#0284c7]",
        },
        {
            id: "2",
            title: "New comment on Flooding",
            code: "#2024-001238",
            time: "18 min ago",
            icon: Building2,
            iconBg: "bg-[#e0f2fe]",
            iconColor: "text-[#0284c7]",
        },
        {
            id: "3",
            title: "New post on Parks",
            code: "#2024-001240",
            time: "1 hour ago",
            icon: Leaf,
            iconBg: "bg-[#dcfce7]",
            iconColor: "text-[#16a34a]",
        },
        {
            id: "4",
            title: "New comment on Streetlights",
            code: "#2024-001230",
            time: "2 hours ago",
            icon: Lightbulb,
            iconBg: "bg-[#fef3c7]",
            iconColor: "text-[#d97706]",
        },
        {
            id: "5",
            title: "New post on Water & Sewer",
            code: "#2024-001239",
            time: "3 hours ago",
            icon: Droplet,
            iconBg: "bg-[#e0f2fe]",
            iconColor: "text-[#0284c7]",
        },
    ];

    return (
        <div className="w-full bg-[#f8fafc]/80 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-1 p-4">
                <div className="flex items-center gap-2 text-[#0f172a] font-bold text-base">
                    <Clock className="w-5 h-5 text-[#0f172a]" />
                    <span>Recent Activity</span>
                </div>
                <button
                    type="button"
                    className="text-md font-semibold text-[#1d63ed] hover:underline cursor-pointer"
                >
                    View All
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-100 divide-y divide-slate-100 overflow-hidden shadow-2xs pr-1">
                {activities.map((item: ActivityItem) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={item.id}
                            className="flex items-center justify-between p-2.5 gap-2 hover:bg-slate-50/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <div
                                    className={`w-9 h-9 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}
                                >
                                    <Icon className={`w-4 h-4 ${item.iconColor} fill-current`} />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-800 text-[17px] leading-tight truncate">
                                        {item.title}
                                    </p>
                                    <p className="text-[15px] text-slate-400 font-normal leading-tight mt-0.5">
                                        {item.code}
                                    </p>
                                </div>
                            </div>

                            <span className="text-[14px] text-slate-500 font-medium shrink-0 self-start pt-0.5">
                                {item.time}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}