export { cn } from "cn"



import type { IssueComment, PriorityLevel, ReportStatus } from "@/types/IssueDetails";

export const STATUS_LABEL: Record<ReportStatus, string> = {
    pending: "Pending",
    in_progress: "In Progress",
    resolved: "Resolved",
    rejected: "Rejected",
};

export const STATUS_STYLES: Record<ReportStatus, string> = {
    pending: "bg-tag-blue-bg text-tag-blue-text border-tag-blue-text/25",
    in_progress: "bg-tag-amber-bg text-tag-amber-text border-tag-amber-text/25",
    resolved: "bg-tag-green-bg text-tag-green-text border-tag-green-text/25",
    rejected: "bg-red-50 text-red-700 border-red-200",
};

export const PRIORITY_LABEL: Record<PriorityLevel, string> = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
};

export const PRIORITY_STYLES: Record<PriorityLevel, string> = {
    low: "bg-section text-muted-foreground border-border-custom",
    medium: "bg-tag-blue-bg text-tag-blue-text border-tag-blue-text/25",
    high: "bg-tag-amber-bg text-tag-amber-text border-tag-amber-text/25",
    critical: "bg-red-50 text-red-700 border-red-200",
};

export const CARD_CLASS = "gap-0 rounded-2xl border-border-custom py-0 shadow-xs";
export const SIDE_CARD_CLASS = "gap-0 rounded-2xl border-border-custom bg-section py-0 shadow-xs";

export function countComments(items: IssueComment[]): number {
    return items.reduce((total, item) => total + 1 + (item.replies?.length ?? 0), 0);
}

export function formatDate(iso?: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
}

export function timeAgo(iso?: string): string {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return "Just now";
    const minutes = Math.floor(diff / 60_000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return formatDate(iso);
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("");
}