import React from "react";
import PageHeader from "@/components/common/PageHeader";
import IssuesMapLayout from "@/components/issues-map/IssuesMapLayout";
import SectionContainer from "@/components/common/SectionContainer";
import { getReportFilters, getReports } from "../actions/report";
import type { Report } from "@/types/report";

export default async function IssuesMapPage(): Promise<React.ReactNode> {
    const [AllPostsRes] = await Promise.all([
        getReports({ page: 1, limit: 100 }).catch(() => ({ posts: [] })),
        getReportFilters().catch(() => ({
            categories: [],
            wards: [],
            statuses: [],
            priorities: [],
        })),
    ]);

    const AllPosts: Report[] = AllPostsRes.posts || [];

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Issues Map"
                description={
                    <>
                        Explore reported community issues on the interactive map <br />
                        and track local infrastructure updates in real time.
                    </>
                }
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Issues Map"
            />
            <SectionContainer className="py-12">
                <IssuesMapLayout AllPosts={AllPosts} />
            </SectionContainer>
        </section>
    );
}