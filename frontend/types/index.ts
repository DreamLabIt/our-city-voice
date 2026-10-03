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

    // ── Single issue details ──
    status: ReportStatus;
    priority: PriorityLevel;
    ward: string;
    department: string;
    assignedOfficer?: string;
    reportedBy: string;
    reporterInitials: string;

    // ── Location ──
    // Mirrors the posts table. `street` and `city` are the clean components a
    // geocoder can resolve; `address` is the display string, which may carry a
    // landmark hint ("near Birchmount Rd") that no geocoder handles.
    // Coordinates are null when the location could not be resolved to a point.
    street?: string;
    city: string;
    address: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
    updatedAt: string;
    details: string[];
    gallery: string[];
    updates: IssueUpdate[];
}

// ── Issue Status Timeline ──────────────────────────────────
export interface IssueUpdate {
    id: string;
    status: ReportStatus;
    title: string;
    note: string;
    date: string;
    actor: string;
}

// ── Issue Comments ─────────────────────────────────────────
export type CommenterRole =
    "Resident" | "Local Business" | "Field Inspector" | "Municipal Officer" | "Ward Councillor";

export interface PostComment {
    id: string;
    postId: string;
    author: string;
    initials: string;
    role: CommenterRole;
    time: string;
    body: string;
    likes: number;
    isOfficial?: boolean;
    replies?: PostComment[];
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
    street?: string;
    city: string;
    address: string;
    postalCode?: string;
    latitude: number | null;
    longitude: number | null;
    status: ReportStatus;
    priority: PriorityLevel;
    date: string;
    description: string;
    upvotes: number;
    commentsCount: number;
    views: number;
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

// ── LocationItem ──────────────────────────────────────
export interface LocationItem {
    id: string;
    name: string;
    subTitle: string;
    reportsCount: number;
    image: string;
    slug: string;
}

// ── StepItem ──────────────────────────────────────
export interface StepItem {
    step: string;
    title: string;
    description: string;
    icon: React.ElementType;
    badgeText: string;
}

// ── Issues map ──────────────────────────────────────
// What a Leaflet marker needs, derived from a PostItem by toMapPin(). Leaflet
// wants plain numbers for lat/lng, and the API will hand coordinates over as
// strings because Postgres DECIMAL serialises that way, so the conversion
// happens in one place rather than at every call site.
export interface IssueMapPin {
    id: string;
    code: string;
    title: string;
    category: string;
    address: string;
    ward: string;
    status: ReportStatus;
    lat: number;
    lng: number;
    updatedAt: string;
    createdAt: string;
}

export type LoginInputs = {
    email: string;
    password: string;
};

export type RegisterInputs = {
    name: string;
    email: string;
    password: string;
    avatar?: FileList | null;
};

export type FormState = {
    error?: string;
    success?: boolean;
};

export type RegisterFormState = {
    error?: string;
    success?: boolean;
};
