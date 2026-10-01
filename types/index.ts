import { LucideIcon } from "lucide-react";

// ── Navigation ──────────────────────────────────────────────
export interface NavItem {
    name: string;
    href: string;
}

// ── Page Header ─────────────────────────────────────────────
export interface PageHeaderProps {
    title: string;
    description?: React.ReactNode;
    bgImage?: string;
    customBreadcrumbName?: string;
}

// ── Category Filter ─────────────────────────────────────────
export interface CategoryItem {
    id: string;
    label: string;
    icon: LucideIcon;
    iconColor?: string;
    isOther?: boolean;
}

// ── Recent Posts ────────────────────────────────────────────
export interface PostItem {
    id: string;
    code: string;
    date: string;
    tag: string;
    tagBg: string;
    tagText: string;
    location: string;
    title: string;
    desc: string;
    comments: number;
    likes: number;
    views: number;
    image: string;
    video?: string;
    isVideo?: boolean;
    duration?: string;
    category: "Latest" | "Most Commented" | "Nearby" | "Map View";
}

// ── Recent Activity ────────────────────────────────────────
export interface ActivityItem {
    id: string;
    title: string;
    code: string;
    time: string;
    icon: LucideIcon;
    iconBg: string;
    iconColor: string;
}

// ── Community Activity ─────────────────────────────────────
export interface StatItem {
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

export interface ChartMonth {
    month: string;
    val: number;
}

// ── Contact Form ───────────────────────────────────────────
export interface ContactFormData {
    name: string;
    email: string;
    phone?: string;
    category: string;
    subject: string;
    message: string;
}

// ── Reports ────────────────────────────────────────────────
export type ReportStatus = "Pending" | "In Progress" | "Resolved" | "Rejected";
export type PriorityLevel = "Low" | "Medium" | "High" | "Critical";

export interface CivicReport {
    id: string;
    trackingId: string;
    title: string;
    category: string;
    ward: string;
    location: string;
    status: ReportStatus;
    priority: PriorityLevel;
    date: string;
    description: string;
    upvotes: number;
    commentsCount: number;
    department: string;
    image: string;
    assignedOfficer?: string;
    updatedAt: string;
}

// ── Statistics ─────────────────────────────────────────────
export type TimeRange = "7d" | "30d" | "1y" | "all";

export interface WardData {
    id: string;
    ward: string;
    total: number;
    resolved: number;
    pending: number;
    avgTimeHours: number;
    slaRate: number;
}

// ── Report Issue Form ──────────────────────────────────────
export interface ReportIssueFormData {
    title: string;
    category: string;
    priority: PriorityLevel;
    location: string;
    description: string;
    reporterName?: string;
    reporterEmail: string;
    reporterPhone?: string;
    isAnonymous: boolean;
}

// ── SearchSuggestion ──────────────────────────────────────
export interface SearchSuggestion {
    id: string;
    title: string;
    category: string;
    location: string;
    type: "report" | "post" | "announcement";
}