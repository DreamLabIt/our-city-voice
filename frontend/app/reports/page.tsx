"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
    initialReports,
    reportCategories as categories,
    reportStatuses as statuses,
    reportWards as wards,
} from "@/data/mock-data";
import type { CivicReport } from "@/types";
import ReportFilters from "@/components/issues/reports/ReportFilters";
import ReportCard from "@/components/issues/reports/ReportCard";
import ReportDetailModal from "@/components/issues/reports/ReportDetailModal";



export default function ReportsPage(): React.ReactNode {
    const [reports, setReports] = useState<CivicReport[]>(initialReports);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedWard, setSelectedWard] = useState<string>("All");
    const [upvotedIds, setUpvotedIds] = useState<string[]>([]);
    const [activeReport, setActiveReport] = useState<CivicReport | null>(null);

    const filteredReports = useMemo(() => {
        return reports.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                selectedCategory === "All" || item.category === selectedCategory;
            const matchesStatus =
                selectedStatus === "All" || item.status === selectedStatus;
            const matchesWard =
                selectedWard === "All" || item.ward === selectedWard;

            return matchesSearch && matchesCategory && matchesStatus && matchesWard;
        });
    }, [reports, searchQuery, selectedCategory, selectedStatus, selectedWard]);

    const handleUpvote = (reportId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const isAlreadyUpvoted = upvotedIds.includes(reportId);

        if (isAlreadyUpvoted) {
            setUpvotedIds((prev) => prev.filter((id) => id !== reportId));
            setReports((prev) =>
                prev.map((r) => (r.id === reportId ? { ...r, upvotes: r.upvotes - 1 } : r))
            );
            toast.info("Endorsement removed");
        } else {
            setUpvotedIds((prev) => [...prev, reportId]);
            setReports((prev) =>
                prev.map((r) => (r.id === reportId ? { ...r, upvotes: r.upvotes + 1 } : r))
            );
            toast.success("Report Endorsed!", {
                description: "Your vote helps prioritize this issue for municipal teams.",
            });
        }
    };

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Public Civic Reports & Tracking"
                description="Browse, filter, track, and endorse real-time community reported issues across municipal wards."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Public Reports"
            />
            <SectionContainer>
                <div className="py-8 sm:py-10 space-y-6 sm:space-y-8">

                    <ReportFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        selectedCategory={selectedCategory}
                        setSelectedCategory={setSelectedCategory}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        selectedWard={selectedWard}
                        setSelectedWard={setSelectedWard}
                        categories={categories}
                        statuses={statuses}
                        wards={wards}
                    />

                    <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                        <span>
                            Showing <strong className="text-foreground">{filteredReports.length}</strong> of {reports.length} Public Reports
                        </span>
                        {(selectedCategory !== "All" ||
                            selectedStatus !== "All" ||
                            selectedWard !== "All" ||
                            searchQuery) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedCategory("All");
                                        setSelectedStatus("All");
                                        setSelectedWard("All");
                                        setSearchQuery("");
                                    }}
                                    className="text-primary hover:underline cursor-pointer"
                                >
                                    Reset Filters
                                </button>
                            )}
                    </div>


                    {filteredReports.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                            {filteredReports.map((report) => (
                                <ReportCard
                                    key={report.id}
                                    report={report}
                                    isUpvoted={upvotedIds.includes(report.id)}
                                    onUpvote={handleUpvote}
                                    onClick={() => setActiveReport(report)}
                                />
                            ))}
                        </div>
                    ) : (

                        <div className="bg-card border border-border rounded-2xl p-8 sm:p-12 text-center space-y-3">
                            <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto" />
                            <h3 className="text-lg font-bold text-foreground">
                                No Civic Reports Found
                            </h3>
                            <p className="text-xs text-muted-foreground max-w-md mx-auto">
                                We couldn't find any reports matching your search query or selected category filter. Try clearing filters.
                            </p>
                        </div>
                    )}
                </div>


                <ReportDetailModal
                    report={activeReport}
                    onClose={() => setActiveReport(null)}
                />
            </SectionContainer>
        </section>
    );
}