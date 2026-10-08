"use client";

import Link from "next/link";
import {
    Clock,
    FileText,
    Lightbulb,
    Droplets,
    TreePine,
    ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RecentActivityCardClientProps, ReportItem } from "@/types/report";

const getCategoryName = (category?: ReportItem["category"]) => {
    if (!category) return "";
    if (typeof category === "string") return category;
    if (typeof category === "object") {
        return category.name || category.label || "";
    }
    return "";
};

const getCategoryMeta = (categoryName: string) => {
    const name = categoryName.toLowerCase();

    if (name.includes("park") || name.includes("tree")) {
        return {
            icon: TreePine,
            iconBg: "bg-emerald-100 dark:bg-emerald-950/50",
            iconColor: "text-emerald-600 dark:text-emerald-400",
        };
    }

    if (name.includes("light") || name.includes("street")) {
        return {
            icon: Lightbulb,
            iconBg: "bg-amber-100 dark:bg-amber-950/50",
            iconColor: "text-amber-600 dark:text-amber-400",
        };
    }

    if (
        name.includes("water") ||
        name.includes("sewer") ||
        name.includes("flood")
    ) {
        return {
            icon: Droplets,
            iconBg: "bg-sky-100 dark:bg-sky-950/50",
            iconColor: "text-sky-600 dark:text-sky-400",
        };
    }

    if (name.includes("road")) {
        return {
            icon: ShieldAlert,
            iconBg: "bg-blue-100 dark:bg-blue-950/50",
            iconColor: "text-blue-600 dark:text-blue-400",
        };
    }

    return {
        icon: FileText,
        iconBg: "bg-blue-100 dark:bg-blue-950/50",
        iconColor: "text-blue-600 dark:text-blue-400",
    };
};

const formatRelativeTime = (date?: string | Date) => {
    if (!date) {
        return "—";
    }

    const updatedAt = new Date(date);

    if (Number.isNaN(updatedAt.getTime())) {
        return "—";
    }

    const now = new Date();

    const diffMs = now.getTime() - updatedAt.getTime();

    if (diffMs <= 60 * 1000) {
        return "Just now";
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
        return `${diffMinutes}m ago`;
    }

    const diffHours = Math.floor(diffMinutes / 60);

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);

    if (diffDays < 30) {
        return `${diffDays}d ago`;
    }

    const diffMonths = Math.floor(diffDays / 30);

    if (diffMonths < 12) {
        return `${diffMonths}mo ago`;
    }

    const diffYears = Math.floor(diffMonths / 12);

    return `${diffYears}y ago`;
};

export default function RecentActivityCardClient({
    initialReports,
}: RecentActivityCardClientProps) {

    return (
        <div className="w-full bg-slate-100 dark:bg-card/40 rounded-2xl border border-border/80 space-y-2 ">

            <div className="flex items-center justify-between px-1 p-4 sm:p-5 ">
                <div className="flex items-center gap-2.5 text-slate-900 dark:text-foreground font-bold text-base sm:text-lg">
                    <Clock className="w-5 h-5 text-slate-900 dark:text-foreground stroke-[2.2]" />
                    <span>Recent Activity</span>
                </div>

                <Button
                    variant="ghost"
                    className="h-auto p-0 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-transparent dark:text-blue-400 cursor-pointer"
                >
                    <Link href="/reports">View All</Link>
                </Button>
            </div>

            <div className="rounded-2xl bg-white py-0 min-h-82">
                {initialReports && initialReports.length > 0 ? (
                    initialReports.map((item) => {
                        const categoryName = getCategoryName(item.category);

                        const {
                            icon: Icon,
                            iconBg,
                            iconColor,
                        } = getCategoryMeta(categoryName);

                        const timeAgo = formatRelativeTime(item.updatedAt);

                        const displayTitle = item.title
                            ? item.title
                            : item.type === "comment"
                                ? `New comment on ${categoryName || "Post"}`
                                : `New post on ${categoryName || "General"}`;

                        const trackingCode = item.trackingCode;

                        return (
                            <Link
                                key={item.id}
                                href={`/reports/${item.trackingCode}`}
                                className="flex items-center justify-between p-3.5 sm:p-4 gap-1 hover:bg-muted/40 transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-3.5 min-w-0 py-0">
                                    <div
                                        className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
                                    >
                                        <Icon
                                            className={`w-5 h-5 ${iconColor}`}
                                        />
                                    </div>

                                    <div className="min-w-0 space-y-0.5">
                                        <p className="font-semibold text-slate-900 dark:text-foreground text-[15px] sm:text-base leading-snug truncate">
                                            {displayTitle}
                                        </p>

                                        <p className="text-xs sm:text-[13px] text-slate-400 dark:text-muted-foreground font-medium tracking-wide truncate">
                                            {trackingCode}
                                        </p>
                                    </div>
                                </div>

                                <span className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground font-medium shrink-0 self-start pt-0.5">
                                    {timeAgo}
                                </span>
                            </Link>
                        );
                    })
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground text-sm">
                        No recent activity found.
                    </div>
                )}
            </div>
        </div>
    );
}