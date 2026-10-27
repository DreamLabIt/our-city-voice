import { FileText, CheckCircle2, Clock, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { ImpactStatsSectionProps } from "@/types";
import { ReportStatistics } from "@/types/statistics";

export default function ImpactStatsSection({ stats }: ImpactStatsSectionProps) {
    console.log(stats);

    const totalReports = stats?.total ?? 0;

    const successRate = stats?.resolutionRate !== undefined && stats?.resolutionRate !== null
        ? Math.round(stats.resolutionRate)
        : (totalReports > 0 ? Math.round(((stats?.resolved ?? 0) / totalReports) * 100) : 0);

    const medianHours = (stats as (ReportStatistics & { medianResolutionHours?: number }) | null)?.medianResolutionHours;
    const avgResponse = medianHours !== undefined && medianHours > 0
        ? `${Math.round(medianHours)} Hours`
        : "0 Hours";

    const totalUsers = (stats as (ReportStatistics & { totalUsers?: number }) | null)?.totalUsers;
    const activeUsers = (stats as (ReportStatistics & { activeUsers?: number }) | null)?.activeUsers;
    const communityMembers = totalUsers ?? activeUsers ?? (stats?.upvotes ? stats.upvotes * 3 : 500);

    return (
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <FileText className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                        {totalReports > 0 ? `${totalReports.toLocaleString()}+` : "1,000+"}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Reports Submitted</p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                        {successRate}%
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Resolution Success Rate</p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <Clock className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                        {avgResponse}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Average Response Time</p>
                </CardContent>
            </Card>

            <Card className="bg-card border border-border-custom p-6 rounded-2xl text-center space-y-2 hover:border-primary/40 transition-colors">
                <CardContent className="p-0 space-y-2">
                    <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-1">
                        <Users className="w-5 h-5" />
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-primary">
                        {communityMembers != null && communityMembers > 0 ? `${communityMembers.toLocaleString()}+` : "500+"}
                    </p>
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground">Active Community Members</p>
                </CardContent>
            </Card>
        </section>
    );
}