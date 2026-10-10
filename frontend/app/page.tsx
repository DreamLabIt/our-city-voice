import CategoryFilter from "@/components/landing/CategoryFilter";
import HeroSection from "@/components/landing/hero";
import HowItWorks from "@/components/landing/HowItWorks";
import HomeLayout from "@/components/landing/HomeLayout";
import ExploreTopLocations from "@/components/landing/ExploreTopLocations";
import { getReports, getReportFilters } from "@/app/actions/report";
import type { Report, FilterOption } from "@/types/report";

export const revalidate = 60;

export default async function Home() {
  const [recentPostsRes, filtersRes, recentActivitiesRes, AllPostsRes] = await Promise.all([
    getReports({ page: 1, limit: 50 }).catch(() => ({ posts: [] })),
    getReportFilters().catch(() => ({
      categories: [],
      wards: [],
      statuses: [],
      priorities: [],
    })),
    getReports({ page: 1, limit: 4 }).catch(() => ({ posts: [] })),
    getReports({ page: 1, limit: 100 }).catch(() => ({ posts: [] })),
  ]);

  const recentPosts: Report[] = recentPostsRes.posts || [];
  const AllPosts: Report[] = AllPostsRes.posts || [];

  const categoryTabs = [
    "Latest",
    ...(filtersRes.categories?.map((category) => category.name) || []),
  ];

  const allCategory = [
    { id: "all", label: "All" },
    ...(filtersRes.categories?.map((category) => ({
      id: category.value || category.name.toLowerCase().replace(/\s+/g, "-"),
      label: category.name,
    })) || []),
  ];

  const filterOptions: FilterOption = {
    categories: filtersRes.categories || [],
    wards: filtersRes.wards || [],
    status:
      filtersRes.statuses?.map((status) => ({
        name: status.value,
        value: status.value,
      })) || [],
  };

  const recentActivities: Report[] = recentActivitiesRes.posts || [];

  return (
    <section>
      <HeroSection AllPosts={AllPosts} />
      <CategoryFilter allCategory={allCategory} />
      <HomeLayout
        recentPosts={recentPosts}
        categoryTabs={categoryTabs}
        filterOptions={filterOptions}
        recentActivities={recentActivities}
      />
      <HowItWorks />
      <ExploreTopLocations
        recentPosts={recentPosts}
      />
    </section>
  );
}