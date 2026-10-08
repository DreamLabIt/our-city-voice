import Link from "next/link";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import { AlertCircle } from "lucide-react";
import ReportFilters from "@/components/issues/reports/ReportFilters";
import PostCard from "@/components/landing/PostCard";
import { getReports, getReportFilters } from "@/app/actions/report";

import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from "@/components/ui/pagination";

import type { GetReportsParams, Report } from "@/types/report";

interface PageProps {
    searchParams: Promise<{
        search?: string;
        category?: string;
        status?: string;
        ward?: string;
        page?: string;
    }>;
}

function getValidPage(value?: string): number {
    const page = Number(value);

    if (!Number.isInteger(page) || page < 1) {
        return 1;
    }

    return page;
}

export const revalidate = 60;

export default async function ReportsPage({
    searchParams,
}: PageProps): Promise<React.ReactNode> {
    const params = await searchParams;

    const searchQuery = params.search?.trim() || "";
    const selectedCategory = params.category || "All";
    const selectedStatus = params.status || "All";
    const selectedWard = params.ward || "All";
    const currentPage = getValidPage(params.page);
    const limit = 12;

    const queryParams: GetReportsParams = {
        page: currentPage,
        limit,
        search: searchQuery || undefined,
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        status:
            selectedStatus !== "All"
                ? (selectedStatus as GetReportsParams["status"])
                : undefined,
        ward: selectedWard !== "All" ? selectedWard : undefined,
    };

    const [reportsData, filtersData] = await Promise.all([
        getReports(queryParams).catch(() => ({
            posts: [],
            total: 0,
            page: 1,
            limit: 12,
            pageCount: 0,
        })),
        getReportFilters().catch(() => ({
            categories: [],
            wards: [],
            statuses: [],
            priorities: [],
        })),
    ]);

    const reports: Report[] = reportsData.posts || [];
    const totalReports = reportsData.total || 0;

    const totalPages =
        reportsData.pageCount || Math.ceil(totalReports / limit) || 1;

    const categories = [
        "All",
        ...(filtersData.categories?.map((category) => category.name) || []),
    ];

    const statuses = [
        "All",
        ...(filtersData.statuses?.map((status) => status.value) || []),
    ];

    const wards = [
        "All",
        ...(filtersData.wards?.map((ward) => ward.name) || []),
    ];

    const hasActiveFilters =
        selectedCategory !== "All" ||
        selectedStatus !== "All" ||
        selectedWard !== "All" ||
        Boolean(searchQuery);

    const createPageUrl = (pageNumber: number) => {
        const query = new URLSearchParams();
        if (searchQuery) query.set("search", searchQuery);
        if (selectedCategory !== "All") query.set("category", selectedCategory);
        if (selectedStatus !== "All") query.set("status", selectedStatus);
        if (selectedWard !== "All") query.set("ward", selectedWard);
        query.set("page", pageNumber.toString());

        return `/reports?${query.toString()}`;
    };

    const getPageNumbers = () => {
        const pages: (number | "ellipsis")[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);

            if (currentPage > 3) {
                pages.push("ellipsis");
            }

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("ellipsis");
            }

            pages.push(totalPages);
        }

        return pages;
    };

    return (
        <section className="w-full min-h-screen bg-background text-foreground">
            <PageHeader
                title="Public Civic Reports & Tracking"
                description="Browse, filter, track, and endorse real-time community reported issues across municipal wards."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Public Reports"
            />

            <SectionContainer>
                <div className="space-y-6 py-8 sm:space-y-8 sm:py-10">
                    <ReportFilters
                        searchQuery={searchQuery}
                        selectedCategory={selectedCategory}
                        selectedStatus={selectedStatus}
                        selectedWard={selectedWard}
                        categories={categories}
                        statuses={statuses}
                        wards={wards}
                    />

                    <div className="flex items-center justify-between px-1 text-xs font-bold text-muted-foreground">
                        <span>
                            Showing{" "}
                            <strong className="text-foreground">
                                {reports.length}
                            </strong>{" "}
                            of{" "}
                            <strong className="text-foreground">
                                {totalReports}
                            </strong>{" "}
                            Public Reports
                        </span>

                        {hasActiveFilters && (
                            <Link
                                href="/reports"
                                className="cursor-pointer text-primary hover:underline"
                            >
                                Reset Filters
                            </Link>
                        )}
                    </div>

                    {reports.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {reports.map((report) => (
                                    <PostCard key={report.id} post={report} />
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pt-6 pb-2">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href={createPageUrl(
                                                        Math.max(1, currentPage - 1)
                                                    )}
                                                    aria-disabled={currentPage <= 1}
                                                    className={
                                                        currentPage <= 1
                                                            ? "pointer-events-none opacity-50"
                                                            : ""
                                                    }
                                                />
                                            </PaginationItem>

                                            {getPageNumbers().map((p, idx) => (
                                                <PaginationItem key={idx}>
                                                    {p === "ellipsis" ? (
                                                        <PaginationEllipsis />
                                                    ) : (
                                                        <PaginationLink
                                                            href={createPageUrl(p)}
                                                            isActive={currentPage === p}
                                                        >
                                                            {p}
                                                        </PaginationLink>
                                                    )}
                                                </PaginationItem>
                                            ))}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href={createPageUrl(
                                                        Math.min(
                                                            totalPages,
                                                            currentPage + 1
                                                        )
                                                    )}
                                                    aria-disabled={
                                                        currentPage >= totalPages
                                                    }
                                                    className={
                                                        currentPage >= totalPages
                                                            ? "pointer-events-none opacity-50"
                                                            : ""
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3 rounded-2xl border border-border bg-card p-8 text-center sm:p-12">
                            <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />

                            <h3 className="text-lg font-bold text-foreground">
                                No Civic Reports Found
                            </h3>

                            <p className="mx-auto max-w-md text-xs text-muted-foreground">
                                We couldn't find any reports matching your search query or selected filters. Try clearing your filters.
                            </p>
                        </div>
                    )}
                </div>
            </SectionContainer>
        </section>
    );
}