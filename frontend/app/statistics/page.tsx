import React from "react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";

import { initialReports, posts } from "@/data/mock-data";
import { buildStatistics } from "@/lib/statistics";

import StatsOverviewCards from "@/components/statistics/StatsOverviewCards";
import StatsBreakdownPanels from "@/components/statistics/StatsBreakdownPanels";
import StatsWardTable from "@/components/statistics/StatsWardTable";
import CommunityResponse from "@/components/statistics/CommunityResponse";
import { ReportStatistics } from "@/types/statistics";
import { getPublicStats } from "../actions/statistics";

export const revalidate = 60;

const dateFormat = new Intl.DateTimeFormat("en-CA", {
    day: "numeric",
    month: "short",
    year: "numeric",
});

const mockStats = buildStatistics([...posts, ...initialReports]) as unknown as ReportStatistics;

export default async function StatisticsPage(): Promise<React.ReactNode> {
    const result = await getPublicStats().catch(() => ({ success: false, stats: undefined }));
    const stats: ReportStatistics = result.success && result.stats ? result.stats : mockStats;
    const firstReportDate = stats.firstReportDate ? new Date(stats.firstReportDate) : null;
    const latestReportDate = stats.latestReportDate ? new Date(stats.latestReportDate) : null;

    const span =
        firstReportDate && latestReportDate
            ? `${dateFormat.format(firstReportDate)} to ${dateFormat.format(latestReportDate)}`
            : "no reports published yet";

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Platform Statistics"
                description="How many issues residents have reported, where they are, and how many have been resolved."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Statistics"
            />

            <SectionContainer>
                <div className="py-10 space-y-8">
                    <p className="text-xs text-muted-foreground">
                        Counted from the {stats.total} reports currently published, {span}.
                    </p>

                    <StatsOverviewCards stats={stats} />

                    <StatsBreakdownPanels stats={stats} />

                    <StatsWardTable stats={stats} />

                    <CommunityResponse stats={stats} />
                </div>
            </SectionContainer>
        </section>
    );
}