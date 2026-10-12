import CategoryFilter from "@/components/landing/CategoryFilter";
import HeroSection from "@/components/landing/hero";
import HowItWorks from "@/components/landing/HowItWorks";
import HomeLayout from "@/components/landing/HomeLayout";
import ExploreTopLocations from "@/components/landing/ExploreTopLocations";
import { getReports, getReportFilters } from "@/app/actions/report";
import type { Report, FilterOption } from "@/types/report";
import { posts as mockPosts, categories as mockCategories } from "@/data/mock-data";

export const revalidate = 60;

export default async function Home() {
    const [recentPostsRes, filtersRes, recentActivitiesRes, allPostsRes] = await Promise.all([
        getReports({ page: 1, limit: 0 }).catch(() => ({ posts: [] })),
        getReportFilters().catch(() => ({
            categories: [],
            wards: [],
            statuses: [],
            priorities: [],
        })),
        getReports({ page: 1, limit: 4 }).catch(() => ({ posts: [] })),
        getReports({ page: 1, limit: 100 }).catch(() => ({ posts: [] })),
    ]);

    const fetchedRecentPosts: Report[] = recentPostsRes.posts || [];
    const fetchedAllPosts: Report[] = allPostsRes.posts || [];
    const fetchedRecentActivities: Report[] = recentActivitiesRes.posts || [];

    const recentPosts: Report[] = fetchedRecentPosts.length > 0 ? fetchedRecentPosts : mockPosts;

    const allPosts: Report[] = fetchedAllPosts.length > 0 ? fetchedAllPosts : mockPosts;

    const recentActivities: Report[] =
        fetchedRecentActivities.length > 0 ? fetchedRecentActivities : mockPosts.slice(0, 4);

    const categoriesList =
        filtersRes.categories.length > 0
            ? filtersRes.categories
            : mockCategories.map((category) => ({
                  name: category.label,
                  value: category.id,
              }));

    const categoryTabs = ["Latest", ...categoriesList.map((category) => category.name)];

    const allCategory = [
        { id: "all", label: "All" },
        ...categoriesList.map((category) => ({
            id: category.value || category.name.toLowerCase().replace(/\s+/g, "-"),
            label: category.name,
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
            <HeroSection AllPosts={allPosts} />

            <CategoryFilter allCategory={allCategory} />

            <HomeLayout
                recentPosts={recentPosts}
                categoryTabs={categoryTabs}
                filterOptions={filterOptions}
                recentActivities={recentActivities}
            />

            <HowItWorks />

            <ExploreTopLocations recentPosts={recentPosts} />
        </section>
    );
}
