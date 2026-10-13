
import { redirect } from "next/navigation";
import DashboardLayout from "@/components/dashboard/(layout)/DashboardLayout";
import IssuesTable from "@/components/dashboard/issues/IssuesTable";
import { getCurrentUser } from "@/lib/session";
import { getReports, getReportFilters } from "@/app/actions/report";
import type { IssuesPageProps } from "@/types/issues";

import {
    posts as mockPosts,
    initialReports as mockReports,
    reportCategories as mockCategories,
    reportStatuses as mockStatuses,
    reportWards as mockWards,
} from "@/data/mock-data";

import type {
    GetReportsParams,
    Report,
    ReportFiltersResponse,
} from "@/types/report";

const LIMIT = 16;
const BASE_PATH = "/dashboard/issues";

const ALL_MOCK_REPORTS: Report[] = [
    ...mockPosts,
    ...mockReports,
];

function getValidPage(value?: string): number {
    const page = Number(value);

    return Number.isInteger(page) && page >= 1 ? page : 1;
}

export default async function IssuesPage({
    searchParams,
}: IssuesPageProps): Promise<React.ReactNode> {
    const user = await getCurrentUser();

    if (!user) {
        redirect(`/login?next=${BASE_PATH}`);
    }

    const params = await searchParams;
    const searchQuery = params.search?.trim() || "";
    const selectedCategory = params.category || "All";
    const selectedStatus = params.status || "All";
    const selectedWard = params.ward || "All";
    const currentPage = getValidPage(params.page);
    const isAdmin = user.role === "super_admin";
    const queryParams: GetReportsParams = {
        page: currentPage,
        limit: LIMIT,
        search: searchQuery || undefined,
        category:
            selectedCategory !== "All"
                ? selectedCategory
                : undefined,
        status:
            selectedStatus !== "All"
                ? (selectedStatus as GetReportsParams["status"])
                : undefined,
        ward:
            selectedWard !== "All"
                ? selectedWard
                : undefined,
        ...(isAdmin ? {} : { mine: true }),
    };

    const [reportsResult, filtersData] = await Promise.all([
        getReports(queryParams).catch(() => null),
        getReportFilters().catch(
            (): ReportFiltersResponse => ({
                categories: [],
                wards: [],
                statuses: [],
                priorities: [],
            })
        ),
    ]);

    const useMock = reportsResult === null;

    let issues: Report[];
    let total: number;
    let totalPages: number;

    if (useMock) {
        const keyword = searchQuery.toLowerCase();

        const filteredReports = ALL_MOCK_REPORTS.filter((report) => {
            if (
                selectedCategory !== "All" &&
                report.category?.slug !== selectedCategory
            ) {
                return false;
            }

            if (
                selectedStatus !== "All" &&
                report.status !== selectedStatus
            ) {
                return false;
            }

            if (
                selectedWard !== "All" &&
                report.ward?.code !== selectedWard
            ) {
                return false;
            }

            if (keyword) {
                const searchableText = [
                    report.title,
                    report.description,
                    report.trackingCode,
                    report.address,
                ]
                    .filter(Boolean)
                    .join(" ")
                    .toLowerCase();

                if (!searchableText.includes(keyword)) {
                    return false;
                }
            }

            return true;
        });

        total = filteredReports.length;
        totalPages = Math.max(1, Math.ceil(total / LIMIT));

        issues = filteredReports.slice(
            (currentPage - 1) * LIMIT,
            currentPage * LIMIT
        );
    } else {
        issues = reportsResult.posts ?? [];
        total = reportsResult.total ?? 0;
        totalPages =
            reportsResult.pageCount ||
            Math.ceil(total / LIMIT) ||
            1;
    }

    const categoriesList =
        filtersData.categories.length > 0
            ? filtersData.categories.map((category) => ({
                slug: category.value,
                name: category.name,
            }))
            : mockCategories;

    const categories = [
        { slug: "All", name: "All Categories" },
        ...categoriesList,
    ];

    const statuses = [
        "All",
        ...(filtersData.statuses.length > 0
            ? filtersData.statuses.map((status) => status.value)
            : mockStatuses),
    ];

    const wardsList =
        filtersData.wards.length > 0
            ? filtersData.wards.map((ward) => ({
                code: ward.value || "",
                name: ward.name,
            }))
            : mockWards;

    const wards = [
        { code: "All", name: "All Wards" },
        ...wardsList,
    ];

    const baseQuery = new URLSearchParams();

    if (searchQuery) {
        baseQuery.set("search", searchQuery);
    }

    if (selectedCategory !== "All") {
        baseQuery.set("category", selectedCategory);
    }

    if (selectedStatus !== "All") {
        baseQuery.set("status", selectedStatus);
    }

    if (selectedWard !== "All") {
        baseQuery.set("ward", selectedWard);
    }

    return (
        <DashboardLayout user={user}>
            <IssuesTable
                issues={issues}
                total={total}
                currentPage={currentPage}
                totalPages={totalPages}
                isAdmin={isAdmin}
                basePath={BASE_PATH}
                baseQuery={baseQuery.toString()}
                filters={{
                    searchQuery,
                    selectedCategory,
                    selectedStatus,
                    selectedWard,
                    categories,
                    statuses,
                    wards,
                }}
            />
        </DashboardLayout>
    );
}
