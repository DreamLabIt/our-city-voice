"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageHeader from "@/components/common/PageHeader";
import SectionContainer from "@/components/common/SectionContainer";
import { AlertCircle, Loader2 } from "lucide-react";
import ReportFilters from "@/components/issues/reports/ReportFilters";
import PostCard from "@/components/landing/PostCard";
import { posts } from "@/data/mock-data";
import type { PostItem } from "@/types";

function ReportsPageContent(): React.ReactNode {
    const searchParams = useSearchParams();
    const wardParam = searchParams.get("ward");

    const [reports, setReports] = useState<PostItem[]>(posts);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedWard, setSelectedWard] = useState<string>("All");

    useEffect(() => {
        if (wardParam) {
            setSelectedWard(wardParam);
        }
    }, [wardParam]);

    const categories = useMemo(() => {
        const unique = Array.from(new Set(posts.map((item) => item.category || item.tag)));
        return ["All", ...unique];
    }, []);

    const statuses = useMemo(() => {
        const unique = Array.from(new Set(posts.map((item) => item.status)));
        return ["All", ...unique];
    }, []);

    const wards = useMemo(() => {
        const unique = Array.from(new Set(posts.map((item) => item.ward)));
        return ["All", ...unique];
    }, []);

    const filteredReports = useMemo(() => {
        return reports.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.desc.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesCategory =
                selectedCategory === "All" ||
                item.category === selectedCategory ||
                item.tag === selectedCategory;

            const matchesStatus =
                selectedStatus === "All" || item.status === selectedStatus;

            const matchesWard =
                selectedWard === "All" || item.ward === selectedWard;

            return matchesSearch && matchesCategory && matchesStatus && matchesWard;
        });
    }, [reports, searchQuery, selectedCategory, selectedStatus, selectedWard]);

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
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2 mb-6">
                            {filteredReports.map((post) => (
                                <PostCard
                                    key={post.id}
                                    post={post}
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
            </SectionContainer>
        </section>
    );
}

export default function ReportsPage(): React.ReactNode {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen w-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }
        >
            <ReportsPageContent />
        </Suspense>
    );
}