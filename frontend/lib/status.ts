import {
    AlertCircle,
    CheckCircle2,
    Clock,
    XCircle,
    type LucideIcon,
} from "lucide-react";

import type { ReportStatus } from "@/types";

/**
 * One definition of how a status looks, shared by the issues map and the
 * statistics page so the same state is never two different colours.
 *
 * Every status ships with an icon and a written label. The tinted fills sit
 * below 3:1 against the page surface, so colour alone is not allowed to carry
 * the meaning. Record<ReportStatus, ...> makes a new status a build error
 * rather than a silently unstyled badge.
 */
export interface StatusMeta {
    icon: LucideIcon;
    /** Tinted pill, for a badge beside a title. */
    badge: string;
    /** Solid fill, for a bar or a legend dot. */
    fill: string;
    /** Text-only accent, for a figure. */
    text: string;
}

export const STATUS_META: Record<ReportStatus, StatusMeta> = {
    Pending: {
        icon: AlertCircle,
        badge:
            "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20",
        fill: "bg-blue-500",
        text: "text-blue-600 dark:text-blue-400",
    },
    "In Progress": {
        icon: Clock,
        badge:
            "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20",
        fill: "bg-amber-500",
        text: "text-amber-600 dark:text-amber-400",
    },
    Resolved: {
        icon: CheckCircle2,
        badge:
            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20",
        fill: "bg-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
    },
    Rejected: {
        icon: XCircle,
        badge:
            "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20",
        fill: "bg-red-500",
        text: "text-red-600 dark:text-red-400",
    },
};
