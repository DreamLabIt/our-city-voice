import CategoryFilter from "@/components/landing/CategoryFilter";
import HeroSection from "@/components/landing/hero";
import HowItWorks from "@/components/landing/HowItWorks";
import HomeLayout from "@/components/landing/HomeLayout";
import ExploreTopLocations from "@/components/landing/ExploreTopLocations";
import { getReports, getReportFilters } from "@/app/actions/report";
import { getActivityStats } from "./actions/statistics";
import type { Report, FilterOption } from "@/types/report";
import { posts as mockPosts, categories as mockCategories } from "@/data/mock-data";
import { CategoryItem } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 60;

export default async function Home() {
    const [recentPostsRes, filtersRes, recentActivitiesRes, activityStatsRes] = await Promise.all([
        getReports({ page: 1, limit: 50 }).catch(() => ({ posts: [] })),
        getReportFilters().catch(() => ({
            categories: [],
            wards: [],
            statuses: [],
            priorities: [],
        })),
        getReports({ page: 1, limit: 4 }).catch(() => ({ posts: [] })),
        getActivityStats().catch(() => ({ success: false, activity: undefined })),
    ]);

    const fetchedRecentPosts: Report[] = recentPostsRes.posts || [];
    const fetchedRecentActivities: Report[] = recentActivitiesRes.posts || [];
    const recentPosts: Report[] = fetchedRecentPosts.length > 0 ? fetchedRecentPosts : mockPosts;
    const recentActivities: Report[] =
        fetchedRecentActivities.length > 0 ? fetchedRecentActivities : mockPosts.slice(0, 4);
    const activityData = activityStatsRes.success ? activityStatsRes.activity : undefined;
    const categoriesList: CategoryItem[] =
        filtersRes.categories.length > 0
            ? filtersRes.categories
            : mockCategories.map((category) => ({
                id: category.id,
                name: category.name,
            }));

    const categoryTabs = ["Latest", ...categoriesList.map((category) => category.name)];

    const allCategory = [
        { id: "all", name: "All" },
        ...categoriesList.map((category) => ({
            id: category.id || category.name.toLowerCase().replace(/\s+/g, "-"),
            name: category.name,
        })),
    ];

    const filterOptions: FilterOption = {
        categories: categoriesList,
        wards: filtersRes.wards || [],
        status:
            filtersRes.statuses.length > 0
                ? filtersRes.statuses.map((status) => ({
                    name: status.value,
                    value: status.value,
                }))
                : [
                    { name: "Pending", value: "pending" },
                    { name: "In Progress", value: "in_progress" },
                    { name: "Resolved", value: "resolved" },
                ],
    };

    return (
        <section>
            <HeroSection />
            <CategoryFilter allCategory={allCategory} />
            <HomeLayout
                recentPosts={recentPosts}
                categoryTabs={categoryTabs}
                filterOptions={filterOptions}
                recentActivities={recentActivities}
                activityData={activityData}
            />
            <HowItWorks />
            <ExploreTopLocations recentPosts={recentPosts} />
        </section>
    );
}
