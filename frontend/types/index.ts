import { LucideIcon } from "lucide-react";

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
// Every figure on the statistics page is counted from the reports themselves,
// so there is nothing here to keep in step by hand. The shapes below are what
// buildStatistics() returns; see lib/statistics.ts.
//
// Deliberately absent: anything SLA-shaped. The schema has no SLA target
// column ("SLA statistics were dropped from the UI"), so a rate against a
// target cannot be derived from a report and would have to be invented.

/** The common shape both fixture sets reduce to. */
export interface ReportSummary {
    id: string;
    code: string;
    title: string;
    status: ReportStatus;
    priority: PriorityLevel;
    category: string;
    ward: string;
    department: string;
    date: Date;
    upvotes: number;
    comments: number;
    views: number;
    /** Null unless the report carries a timeline that reaches Resolved. */
    resolutionHours: number | null;
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
    /** Percentage, one decimal. 0 when there are no reports. */
    resolutionRate: number;
    byStatus: StatusCount[];
    byPriority: CountRow[];
    byCategory: CountRow[];
    byWard: WardBreakdown[];
    upvotes: number;
    comments: number;
    views: number;
    /** Median hours from first timeline entry to resolution, null when none. */
    medianResolutionHours: number | null;
    /** How many reports that median is based on. Small, so it is shown. */
    resolutionSampleSize: number;
    firstReportDate: Date | null;
    latestReportDate: Date | null;
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
}

// ── Accounts ──────────────────────────────────────────────
// Two roles, mirroring the user_role enum. A third tier was dropped because
// nothing enforced it: see the comment on the enum in schema.prisma.
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
// Which set of rules a signature request is asking for. The server owns the
// folder, size cap and format list behind each name; see lib/cloudinary.ts.
export type UploadKind = "avatar" | "report-media";

/** A finished upload. The `url` is what gets stored in the database. */
export interface UploadedFile {
    url: string;
    /** Cloudinary's own identifier, kept so a file can be deleted later. */
    publicId: string;
    resourceType: "image" | "video";
    format: string;
    bytes: number;
    width: number | null;
    height: number | null;
    /** Video only. */
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
    /**
     * The finished upload, not the file. The image reaches Cloudinary before the
     * form is submitted, so what the server action receives is a URL string.
     */
    avatar?: UploadedFile | null;
};

export type FormState = {
    error?: string;
    /**
     * field -> messages, straight from the API's validation envelope, so a
     * server-side rule lands on the input it belongs to rather than in a banner.
     */
    fieldErrors?: Record<string, string[]>;
    success?: boolean;
};

/** Registration has nothing extra to report. Kept as a name, not a shape. */
export type RegisterFormState = FormState;

export type TopWardLocation = {
    ward: string;
    reportsCount: number;
    samplePost: PostItem;
};

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
    children: React.ReactNode;
    isAdmin?: boolean;
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


export interface FilterValues {
    category: string;
    municipality: string;
    ward: string;
    road: string;
    postalCode: string;
    address: string;
}