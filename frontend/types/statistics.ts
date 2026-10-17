
export interface StatusStat {
    status: "pending" | "in_progress" | "resolved" | "rejected";
    count: number;
}

export interface PriorityStat {
    label: "Critical" | "High" | "Medium" | "Low";
    count: number;
}

export interface CategoryStat {
    label: string;
    count: number;
}

export interface WardStat {
    ward: string;
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
}

export interface ReportStatistics {
    total: number;
    open: number;
    resolved: number;
    resolutionRate: number;
    byStatus: StatusStat[];
    byPriority: PriorityStat[];
    byCategory: CategoryStat[];
    byWard: WardStat[];
    upvotes: number;
    comments: number;
    views: number;
    medianResolutionHours: number | null;
    resolutionSampleSize: number;
    firstReportDate: string | null;
    latestReportDate: string | null;
}

export interface MonthlyActivity {
    month: string;
    count: number;
}

export interface ActivitySummary {
    year: number;
    reports: number;
    comments: number;
    activeUsers: number;
    reportsThisMonth: number;
    reportsLastMonth: number;
    reportsChangePercent: number | null;
    monthly: MonthlyActivity[];
}

export interface AdminOverview {
    stats: ReportStatistics;
    moderation: {
        deleted: number;
    };
    users: {
        total: number;
        superAdmins: number;
        newThisMonth: number;
    };
    contactMessages: {
        total: number;
        unhandled: number;
    };
    activity: ActivitySummary;
}

export interface GetPublicStatsResponse {
    success: boolean;
    stats?: ReportStatistics;
    error?: string;
}

export interface GetMyStatsResponse {
    success: boolean;
    stats?: ReportStatistics;
    error?: string;
    requiresAuth?: boolean;
}

export interface GetActivityStatsResponse {
    success: boolean;
    activity?: ActivitySummary;
    error?: string;
}

export interface GetAdminOverviewResponse {
    success: boolean;
    data?: AdminOverview;
    error?: string;
    requiresAuth?: boolean;
}

export interface StatsOverviewCardsProps {
    stats: ReportStatistics;
}

export interface StatsBreakdownPanelsProps {
    stats: ReportStatistics;
}


export interface CommunityResponseProps {
    stats: ReportStatistics;
}

export interface StatsWardTableProps {
    stats: ReportStatistics;
}
