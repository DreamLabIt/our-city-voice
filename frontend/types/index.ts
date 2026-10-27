import { LucideIcon } from "lucide-react";
import type { Report, ReportStatus, Priority } from "@/types/report";
import { ActivitySummary, AdminOverview, ReportStatistics } from "./statistics";

// ── Navigation ──────────────────────────────────────────────
export interface NavItem {
    name?: string;
    href: string;
    title?: string;
    icon?: LucideIcon;
    badge?: string;
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
    name: string;
    icon?: LucideIcon;
    iconColor?: string;
    isOther?: boolean;
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

export interface CountRow {
    label: string;
    count: number;
}

export interface StatusCount {
    status: ReportStatus;
    count: number;
}

export interface WardBreakdown {
    ward: string;
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
}

export interface PlatformStatistics {
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
    byStatus: StatusCount[];
    byPriority: CountRow[];
    byCategory: CountRow[];
    byWard: WardBreakdown[];
    upvotes: number;
    comments: number;
    views: number;
    medianResolutionHours: number | null;
    resolutionSampleSize: number;
    firstReportDate: Date | null;
    latestReportDate: Date | null;
}

// ── Report Issue Form ──────────────────────────────────────
export interface ReportIssueFormData {
    title: string;
    category: string;
    priority: Priority;
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
export interface IssueMapPin {
    id: string;
    trackingCode: string;
    title: string;
    category: string;
    address: string;
    ward: string;
    status: ReportStatus;
    lat: number;
    lng: number;
    updatedAt: string;
}

// ── Accounts ──────────────────────────────────────────────
export type UserRole = "user" | "super_admin";

/** What GET /auth/me returns. Never includes anything password-shaped. */
export interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    avatarUrl: string | null;
    departmentId: string | null;
    emailVerifiedAt: string | null;
    createdAt: string;
}

// ── Uploads ───────────────────────────────────────────────

export type UploadKind = "avatar" | "report-media";

export interface UploadedFile {
    url: string;
    publicId: string;
    resourceType: "image" | "video";
    format: string;
    bytes: number;
    width: number | null;
    height: number | null;
    durationSeconds: number | null;
    originalFilename: string | null;
}

// ── Auth forms ────────────────────────────────────────────
export type LoginInputs = {
    email: string;
    password: string;
};

export type RegisterInputs = {
    name: string;
    email: string;
    password: string;
    avatar?: UploadedFile | null;
};

export type FormState = {
    error?: string;
    fieldErrors?: Record<string, string[]>;
    success?: boolean;
    warning?: string;
};

export type RegisterFormState = FormState;

export interface ErrorPageProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export interface RuleItem {
    icon: React.ElementType;
    title: string;
    desc: string;
}

export interface ProhibitedActivity {
    title: string;
    desc: string;
}

export interface HighlightItem {
    icon: React.ElementType;
    title: string;
    desc: string;
}

export interface DataTypeRow {
    category: string;
    items: string;
    purpose: string;
}

export interface HeaderProps {
    isAdmin: boolean;
    user: AuthUser;
    name?: string;
    email?: string;
    userAvatar?: string;
}

export interface SidebarProps {
    isAdmin: boolean;
    user: AuthUser;
    isCollapsed: boolean;
    setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

export interface DashboardLayoutProps {
    children?: React.ReactNode;
    isAdmin?: boolean;
    user?: AuthUser;
}

export interface DashboardClientLayoutProps {
    children: React.ReactNode;
    user: AuthUser;
    isAdmin?: boolean;
}

export interface UserProfileData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: "super_admin" | "user";
    avatarUrl?: string | null;
    joinedDate?: string;
    location?: string;
    bio?: string;
}

export interface ProfileHeaderProps {
    user: UserProfileData;
}

export interface SearchDialogProps {
    Reports?: Report[];
}

export interface NavbarProps {
    user: AuthUser | null;
    Reports?: Report[];
}

export interface ConditionalLayoutProps {
    children: React.ReactNode;
    user: AuthUser | null;
    Reports?: Report[];
}

export interface HeroSectionProps {
    AllPosts?: Report[];
}

export interface IssueSearchBarProps {
    onSearch?: (query: string) => void;
    AllPosts?: Report[];
}

export interface CategoryFilterProps {
    allCategory?: CategoryItem[];
    onSelectCategory?: (categoryId: string) => void;
}

export interface CommunityActivityProps {
    activityData?: ActivitySummary;
}

export interface OverviewProps {
    user: AuthUser;
    isAdmin?: boolean;
    adminOverview?: AdminOverview | null;
    myStats?: ReportStatistics | null;
}

export interface CategoryItemTable {
    label: string;
    count: number;
}

export interface WardItem {
    ward: string;
    total: number;
    pending: number;
    inProgress?: number;
    resolved?: number;
    rejected?: number;
}

export interface CloudinaryConfig {
    cloudName: string;
    apiKey: string;
    apiSecret: string;
    rootFolder: string;
}

export interface HeroSectionProps {
    stats: ReportStatistics | null | undefined;
}
export interface ImpactStatsSectionProps {
    stats: ReportStatistics | null | undefined;
}