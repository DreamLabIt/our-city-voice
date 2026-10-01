"use client";

import React, { useState, useMemo, useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { toast } from "sonner";
import {
    Search,
    Filter,
    Plus,
    MapPin,
    Calendar,
    AlertCircle,
    ThumbsUp,
    MessageSquare,
    Download,
    X,
    Building2,
    ChevronRight,
    Tag,
} from "lucide-react";
import {
    initialReports,
    reportCategories as categories,
    reportStatuses as statuses,
    reportWards as wards,
} from "@/data/mock-data";
import type { CivicReport } from "@/types";
import Link from "next/link";

export default function ReportsPage(): React.ReactNode {
    const [reports, setReports] = useState<CivicReport[]>(initialReports);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedCategory, setSelectedCategory] = useState<string>("All");
    const [selectedStatus, setSelectedStatus] = useState<string>("All");
    const [selectedWard, setSelectedWard] = useState<string>("All");
    const [upvotedIds, setUpvotedIds] = useState<string[]>([]);
    const [activeReport, setActiveReport] = useState<CivicReport | null>(null);

    useEffect(() => {
        if (!activeReport) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setActiveReport(null);
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = "unset";
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [activeReport]);

    const filteredReports = useMemo(() => {
        return reports.filter((item) => {
            const matchesSearch =
                item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.trackingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                item.location.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
            const matchesStatus = selectedStatus === "All" || item.status === selectedStatus;
            const matchesWard = selectedWard === "All" || item.ward === selectedWard;

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

    const handleExportCSV = () => {
        const escapeCsvField = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;

        const headers = ["Tracking ID", "Title", "Category", "Ward", "Status", "Priority", "Date", "Upvotes", "Department"];
        const rows = filteredReports.map((r) => [
            escapeCsvField(r.trackingId),
            escapeCsvField(r.title),
            escapeCsvField(r.category),
            escapeCsvField(r.ward),
            escapeCsvField(r.status),
            escapeCsvField(r.priority),
            escapeCsvField(r.date),
            escapeCsvField(r.upvotes),
            escapeCsvField(r.department),
        ].join(","));

        const csvContent = [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `OurCityVoice_Reports_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("Reports Exported!", { description: "CSV file downloaded successfully." });
    };

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Public Civic Reports & Tracking"
                description="Browse, filter, track, and endorse real-time community reported issues across municipal wards."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Public Reports"
            />

            <div className="max-w-[1940px] mx-auto px-4 sm:px-8 md:px-10 py-10 space-y-8">

                <div className="bg-border-custom/30 p-5 rounded-2xl shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search by report title, id or location..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-section border border-border-custom rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    aria-label="Clear search input"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground cursor-pointer"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                className="px-4 py-2.5 bg-section hover:bg-card border border-border-custom text-foreground rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                            >
                                <Download className="w-4 h-4 text-primary" />
                                <span className="hidden sm:inline">Export CSV</span>
                            </button>

                            <Link
                                href="/report-issue"
                                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Report an Issue</span>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border-custom/60">
                        <div className="space-y-1">
                            <label htmlFor="category-select" className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                                <Tag className="w-3 h-3 text-primary" /> Category
                            </label>
                            <select
                                id="category-select"
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="w-full bg-section border border-border-custom text-xs font-semibold text-foreground rounded-xl p-2.5 focus:outline-none cursor-pointer"
                            >
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="status-select" className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                                <Filter className="w-3 h-3 text-primary" /> Status
                            </label>
                            <select
                                id="status-select"
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full bg-section border border-border-custom text-xs font-semibold text-foreground rounded-xl p-2.5 focus:outline-none cursor-pointer"
                            >
                                {statuses.map((st) => (
                                    <option key={st} value={st}>{st}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label htmlFor="ward-select" className="text-[11px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-primary" /> Ward / Region
                            </label>
                            <select
                                id="ward-select"
                                value={selectedWard}
                                onChange={(e) => setSelectedWard(e.target.value)}
                                className="w-full bg-section border border-border-custom text-xs font-semibold text-foreground rounded-xl p-2.5 focus:outline-none cursor-pointer"
                            >
                                {wards.map((w) => (
                                    <option key={w} value={w}>{w}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-muted px-1">
                    <span>
                        Showing <strong className="text-foreground">{filteredReports.length}</strong> of {reports.length} Public Reports
                    </span>
                    {(selectedCategory !== "All" || selectedStatus !== "All" || selectedWard !== "All" || searchQuery) && (
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReports.map((report) => {
                            const isUpvoted = upvotedIds.includes(report.id);
                            return (
                                <div
                                    key={report.id}
                                    onClick={() => setActiveReport(report)}
                                    className="bg-card border border-border-custom rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="relative h-48 w-full overflow-hidden bg-section">
                                            <img
                                                src={report.image}
                                                alt={report.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                                            <span className="absolute top-3 left-3 bg-card/90 backdrop-blur-md text-primary font-mono text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-border-custom">
                                                {report.trackingId}
                                            </span>

                                            <span
                                                className={`absolute top-3 right-3 text-[11px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md border ${report.status === "Resolved"
                                                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                                    : report.status === "In Progress"
                                                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                                        : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                                                    }`}
                                            >
                                                {report.status}
                                            </span>

                                            <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium flex items-center gap-1.5 truncate">
                                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                <span className="truncate">{report.location}</span>
                                            </div>
                                        </div>

                                        <div className="p-5 space-y-3">
                                            <div className="flex items-center justify-between text-[11px] font-semibold text-muted">
                                                <span className="text-primary font-bold">{report.category}</span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" /> {report.date}
                                                </span>
                                            </div>

                                            <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                                {report.title}
                                            </h3>

                                            <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                                                {report.description}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="px-5 py-3.5 bg-section/60 border-t border-border-custom/60 flex items-center justify-between text-xs font-semibold">
                                        <button
                                            type="button"
                                            onClick={(e) => handleUpvote(report.id, e)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${isUpvoted
                                                ? "bg-primary text-white border-primary"
                                                : "bg-card text-foreground border-border-custom hover:border-primary/50"
                                                }`}
                                        >
                                            <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-white" : ""}`} />
                                            <span>{report.upvotes}</span>
                                        </button>

                                        <div className="flex items-center gap-3 text-muted">
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3.5 h-3.5" /> {report.commentsCount}
                                            </span>
                                            <span className="flex items-center gap-1 text-primary font-bold group-hover:underline">
                                                View <ChevronRight className="w-3.5 h-3.5" />
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-card border border-border-custom rounded-2xl p-12 text-center space-y-3">
                        <AlertCircle className="w-10 h-10 text-muted mx-auto" />
                        <h3 className="text-lg font-bold text-foreground">No Civic Reports Found</h3>
                        <p className="text-xs text-muted max-w-md mx-auto">
                            We couldn't find any reports matching your search query or selected category filter. Try clearing filters.
                        </p>
                    </div>
                )}

            </div>

            {activeReport && (
                <div
                    className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
                    onClick={() => setActiveReport(null)}
                >
                    <div
                        className="bg-card border border-border-custom rounded-2xl max-w-2xl w-full p-6 space-y-6 relative max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setActiveReport(null)}
                            aria-label="Close report overview"
                            className="absolute top-4 right-4 p-2 bg-section hover:bg-border-custom text-foreground rounded-full transition-colors cursor-pointer"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                                    {activeReport.trackingId}
                                </span>
                                <span className="text-xs font-bold text-muted">{activeReport.category}</span>
                            </div>
                            <h2 className="text-xl font-extrabold text-foreground">{activeReport.title}</h2>
                        </div>

                        <div className="w-full h-64 rounded-xl overflow-hidden bg-section border border-border-custom">
                            <img src={activeReport.image} alt={activeReport.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-muted uppercase tracking-wider">Report Description</h4>
                            <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-section p-4 rounded-xl border border-border-custom">
                                {activeReport.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-section p-3 rounded-xl border border-border-custom">
                                <span className="text-muted block text-[10px]">Location / Ward</span>
                                <span className="font-bold text-foreground mt-0.5 block">{activeReport.ward}</span>
                            </div>
                            <div className="bg-section p-3 rounded-xl border border-border-custom">
                                <span className="text-muted block text-[10px]">Department</span>
                                <span className="font-bold text-primary mt-0.5 block">{activeReport.department}</span>
                            </div>
                            <div className="bg-section p-3 rounded-xl border border-border-custom">
                                <span className="text-muted block text-[10px]">Assigned Officer</span>
                                <span className="font-bold text-foreground mt-0.5 block">{activeReport.assignedOfficer || "Unassigned"}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border-custom flex items-center justify-between">
                            <span className="text-xs text-muted">Last updated: {activeReport.updatedAt}</span>
                            <button
                                type="button"
                                onClick={() => setActiveReport(null)}
                                className="px-5 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
                            >
                                Close Overview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section >
    );
}