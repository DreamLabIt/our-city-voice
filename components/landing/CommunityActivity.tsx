"use client";

import React from "react";
import { MessageSquare, MessageCircle, Users, Calendar, LucideIcon } from "lucide-react";

interface StatItem {
    title: string;
    sub: string;
    value: string;
    icon: LucideIcon;
    cardBg: string;
    circleBg: string;
    iconColor: string;
    valueColor: string;
    badge?: string;
}

interface ChartMonth {
    month: string;
    val: number;
}

export default function CommunityActivity(): React.JSX.Element {
    const stats: StatItem[] = [
        {
            title: "Total Posts",
            sub: "This Year",
            value: "1,248",
            icon: MessageSquare,
            cardBg: "bg-[#f4f8ff]",
            circleBg: "bg-[#dbeafe]",
            iconColor: "text-[#1d63ed]",
            valueColor: "text-[#1e3a8a]",
        },
        {
            title: "Comments",
            sub: "This Year",
            value: "3,892",
            icon: MessageCircle,
            cardBg: "bg-[#f0fdf4]",
            circleBg: "bg-[#dcfce7]",
            iconColor: "text-[#16a34a]",
            valueColor: "text-[#064e3b]",
        },
        {
            title: "Active Users",
            sub: "This Year",
            value: "410",
            icon: Users,
            cardBg: "bg-[#fffbeb]",
            circleBg: "bg-[#fef3c7]",
            iconColor: "text-[#d97706]",
            valueColor: "text-[#d97706]",
        },
        {
            title: "Posts This Month",
            sub: "vs. Last Month",
            badge: "↑ 12%",
            value: "105",
            icon: Calendar,
            cardBg: "bg-[#faf5ff]",
            circleBg: "bg-[#f3e8ff]",
            iconColor: "text-[#9333ea]",
            valueColor: "text-[#581c87]",
        },
    ];

    const chartMonths: ChartMonth[] = [
        { month: "Jan", val: 38 },
        { month: "Feb", val: 52 },
        { month: "Mar", val: 65 },
        { month: "Apr", val: 72 },
        { month: "May", val: 88 },
        { month: "Jun", val: 60 },
        { month: "Jul", val: 102 },
        { month: "Aug", val: 125 },
        { month: "Sep", val: 152 },
        { month: "Oct", val: 168 },
        { month: "Nov", val: 138 },
        { month: "Dec", val: 116 },
    ];

    const yTicks: number[] = [200, 150, 100, 50, 0];

    return (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                <div className="lg:col-span-7 space-y-3">
                    <h2 className="text-base font-bold text-[#0f172a]">Community Activity</h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                        {stats.map((item: StatItem, idx: number) => {
                            const Icon = item.icon;
                            return (
                                <div
                                    key={idx}
                                    className={`${item.cardBg} rounded-2xl p-3.5 border border-slate-100 flex items-start gap-3.5 h-30 relative pt-4`}
                                >
                                    <div className={`w-12 h-12 rounded-full ${item.circleBg} flex items-center justify-center shrink-0`}>
                                        <Icon className={`w-6 h-6 ${item.iconColor} fill-current`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <span className={`text-xl font-extrabold ${item.valueColor} leading-none block`}>
                                            {item.value}
                                        </span>
                                        <p className="text-[10px] font-semibold text-slate-700 mt-1 leading-tight truncate">
                                            {item.title}
                                        </p>

                                        {item.badge ? (
                                            <div className="mt-1">
                                                <span className="text-[11px] font-bold text-emerald-600 block leading-tight">
                                                    {item.badge}
                                                </span>
                                                <p className="text-[9px] text-slate-400 leading-tight">{item.sub}</p>
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-slate-400 mt-0.5">{item.sub}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 space-y-2">
                    <h2 className="text-base font-bold text-[#0f172a]">
                        Posts per Month <span className="text-xs font-normal text-slate-500">(This Year)</span>
                    </h2>

                    <div className="relative pt-2">
                        <div className="h-32 flex items-stretch">

                            <div className="flex flex-col justify-between text-[10px] text-slate-400 font-medium pr-2 text-right shrink-0">
                                {yTicks.map((tick: number) => (
                                    <span key={tick} className="leading-none">{tick}</span>
                                ))}
                            </div>

                            <div className="flex-1 relative flex flex-col justify-between">

                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                    {yTicks.map((_: number, i: number) => (
                                        <div key={i} className="w-full border-b border-slate-100" />
                                    ))}
                                </div>

                                <div className="absolute inset-0 flex items-end justify-between gap-1 pl-1">
                                    {chartMonths.map((m: ChartMonth, i: number) => (
                                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group z-10">
                                            <div
                                                className="w-full max-w-4.5 bg-[#4299e1] hover:bg-[#3182ce] rounded-t-sm transition-all"
                                                style={{ height: `${(m.val / 200) * 100}%` }}
                                            />
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>

                        <div className="flex justify-between pl-6 mt-1.5">
                            {chartMonths.map((m: ChartMonth, i: number) => (
                                <span key={i} className="flex-1 text-center text-[10px] text-slate-500 font-medium">
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