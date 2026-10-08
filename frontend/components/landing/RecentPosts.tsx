import { getReports, getReportFilters } from "@/app/actions/report";
import type { Report } from "@/types/report";
import RecentPostsClient from "./RecentPostsClient";

export const revalidate = 60;

export default async function RecentPosts() {
    const [reportsData, filtersData] = await Promise.all([
        getReports({ page: 1, limit: 50 }).catch(() => ({ posts: [] })),
        getReportFilters().catch(() => ({ categories: [] })),
    ]);

    const allPosts: Report[] = reportsData.posts || [];
    const categoryTabs = [
        "Latest",
        ...(filtersData.categories?.map((cat) => cat.name) || []),
    ];

    return <RecentPostsClient initialPosts={allPosts} tabs={categoryTabs} />;
}