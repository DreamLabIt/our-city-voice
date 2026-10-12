import React from "react";
import PageHeader from "@/components/common/PageHeader";
import IssuesMapLayout from "@/components/issues-map/IssuesMapLayout";
import SectionContainer from "@/components/common/SectionContainer";
import { getReportFilters, getReports } from "../actions/report";
import type { Report } from "@/types/report";
import { posts as mockPosts } from "@/data/mock-data";


export default async function IssuesMapPage(): Promise<React.ReactNode> {
    const [PostsRes] = await Promise.all([
        getReports({ page: 1, limit: 50 }).catch(() => ({ posts: [] })),
        getReportFilters().catch(() => ({
            categories: [],
            wards: [],
            statuses: [],
            priorities: [],
        })),
    ]);

    const fetchedPosts: Report[] = PostsRes.posts || [];
    const AllPosts: Report[] = fetchedPosts.length > 0 ? fetchedPosts : mockPosts;

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