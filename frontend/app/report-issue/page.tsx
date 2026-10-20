import PageHeader from "@/components/common/PageHeader";
import { Loader2 } from "lucide-react";
import ReportForm from "@/components/report-issue/ReportForm";
import PlatformInsightsCard from "@/components/report-issue/PlatformInsightsCard";
import MostReportedIssuesCard from "@/components/report-issue/MostReportedIssuesCard";
import HowIssuesAreSolvedFaqCard from "@/components/report-issue/HowIssuesAreSolvedFaqCard";
import QuickReminderCard from "@/components/report-issue/QuickReminderCard";
import SectionContainer from "@/components/common/SectionContainer";
import { getReportFilters, getReports } from "../actions/report";
import type { Report } from "@/types/report";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/session";

async function ReportIssueContent() {
    const [PostsRes, filtersRes] = await Promise.all([
        getReports({ page: 1, limit: 100 }).catch(() => ({ posts: [] })),
        getReportFilters().catch(() => ({
            categories: [],
            wards: [],
            statuses: [],
            priorities: [],
        })),
    ]);

    const user = await getCurrentUser();
    const Reports: Report[] = PostsRes.posts || [];

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Report an Issue"
                description="Notice damaged public infrastructure in your neighborhood? Submit a report with photo evidence and location details to alert municipal authorities."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Report Issue"
            />
            <SectionContainer>
                <div className="py-12 md:py-16">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                        <div className="lg:col-span-7 xl:col-span-8">
                            <ReportForm reportFilters={filtersRes} user={user} />
                        </div>

                        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
                            <PlatformInsightsCard Reports={Reports} />
                            <MostReportedIssuesCard Reports={Reports} />
                            <HowIssuesAreSolvedFaqCard />
                            <QuickReminderCard />
                        </div>
                    </div>
                </div>
            </SectionContainer>
        </section>
    );
}

export default function ReportIssuePage(): React.ReactNode {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center bg-background">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <ReportIssueContent />
        </Suspense>
    );
}