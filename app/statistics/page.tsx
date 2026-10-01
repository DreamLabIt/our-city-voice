"use client";

import React, { useState, useMemo } from "react";
import PageHeader from "@/components/common/PageHeader";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    PieChart as RePieChart,
    Pie,
    Cell,
} from "recharts";
import { toast } from "sonner";
import {
    BarChart3,
    TrendingUp,
    CheckCircle2,
    Clock,
    AlertTriangle,
    PieChart,
    MapPin,
    Activity,
    Calendar,
    ShieldCheck,
    Building2,
    Download,
    Search,
    RefreshCw,
    Award,
    ArrowUpRight,
    SlidersHorizontal,
} from "lucide-react";
import {
    monthlyTrendData,
    categoryChartData,
    departmentSLA,
    initialWardData,
    CHART_TOOLTIP_STYLE,
} from "@/data/mock-data";
import type { TimeRange } from "@/types";

export default function StatisticsPage(): React.ReactNode {
    const [timeRange, setTimeRange] = useState<TimeRange>("30d");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

    const timeRangeMultiplier = useMemo(() => {
        switch (timeRange) {
            case "7d": return 0.25;
            case "30d": return 1;
            case "1y": return 12;
            case "all": return 15;
            default: return 1;
        }
    }, [timeRange]);

    const { totalReports, resolvedReports, pendingReports, successRate } = useMemo(() => {
        const total = Math.round(15420 * timeRangeMultiplier);
        const resolved = Math.round(13580 * timeRangeMultiplier);
        const pending = total - resolved;
        const rate = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";

        return {
            totalReports: total,
            resolvedReports: resolved,
            pendingReports: pending,
            successRate: rate,
        };
    }, [timeRangeMultiplier]);

    const filteredWards = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        return initialWardData.filter((item) => {
            const matchesSearch = !query || item.ward.toLowerCase().includes(query);
            if (statusFilter === "high") return matchesSearch && item.slaRate >= 90;
            if (statusFilter === "optimal") return matchesSearch && item.slaRate >= 85 && item.slaRate < 90;
            if (statusFilter === "low") return matchesSearch && item.slaRate < 85;
            return matchesSearch;
        });
    }, [searchQuery, statusFilter]);

    const handleRefresh = (): void => {
        setIsRefreshing(true);
        setTimeout(() => {
            setIsRefreshing(false);
            toast.success("Analytics Data Refreshed!", {
                description: "All statistics and ward metrics have been synchronized with live database server.",
            });
        }, 1000);
    };

    const handleExportCSV = (): void => {
        const headers = ["Ward ID,Ward Name,Total Reports,Resolved,Pending,Avg Response Time (Hrs),SLA Rate (%)"];
        const rows = filteredWards.map(
            (w) => `${w.id},"${w.ward}",${w.total},${w.resolved},${w.pending},${w.avgTimeHours},${w.slaRate}%`
        );
        const csvString = [headers, ...rows].join("\n");
        const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `OurCityVoice_Statistics_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success("CSV Report Exported!", {
            description: "Your analytics spreadsheet has been downloaded.",
        });
    };

    return (
        <section className="w-full bg-background text-foreground min-h-screen">
            <PageHeader
                title="Platform Statistics & Analytics"
                description="Real-time analytics dashboard tracking municipal issue reporting, resolution throughput, category trends, and departmental SLA performance."
                bgImage="/hero-bg.jpg"
                customBreadcrumbName="Statistics"
            />

            <div className="max-w-[1940px] mx-auto px-4 sm:px-8 md:px-10 py-10 space-y-16">

                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-card border border-border-custom p-4 sm:p-5 rounded-2xl">
                    <div className="flex flex-col gap-2">
                        <h2 className="text-base font-bold text-foreground">Live Analytics Control Hub</h2>
                        <p className="text-xs text-muted">Showing data aggregated for selected timeframe</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center bg-section p-1 rounded-xl border border-border-custom">
                            {(["all", "7d", "30d", "1y"] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer uppercase ${timeRange === range
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-muted hover:text-foreground"
                                        }`}
                                >
                                    {range === "7d"
                                        ? "7 Days"
                                        : range === "30d"
                                            ? "30 Days"
                                            : range === "1y"
                                                ? "1 Year"
                                                : "All"}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="p-2.5 bg-section hover:bg-card border border-border-custom text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="Refresh Data"
                        >
                            <RefreshCw className={`w-4 h-4 text-primary ${isRefreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>

                        <button
                            onClick={handleExportCSV}
                            className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer shadow-sm"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export CSV Report</span>
                        </button>
                    </div>
                </div>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-primary/6 p-6 rounded-2xl space-y-3 hover:border-primary/40 transition-colors border-l-6 border-l-primary/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Total Issues</span>
                            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-extrabold text-foreground">{totalReports.toLocaleString()}</p>
                            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" /> +14.2% activity rate
                            </p>
                        </div>
                    </div>

                    <div className="bg-primary/6 p-6 rounded-2xl space-y-3 hover:border-primary/40 transition-colors border-l-6 border-l-primary/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Resolved Cases</span>
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-extrabold text-foreground">{resolvedReports.toLocaleString()}</p>
                            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                <ShieldCheck className="w-3.5 h-3.5" /> {successRate}% Resolution Rate
                            </p>
                        </div>
                    </div>

                    <div className="bg-primary/6 p-6 rounded-2xl space-y-3 hover:border-primary/40 transition-colors border-l-6 border-l-primary/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Active Pending</span>
                            <div className="p-2.5 bg-amber-500/10 text-amber-500 rounded-xl">
                                <Clock className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-extrabold text-foreground">{pendingReports.toLocaleString()}</p>
                            <p className="text-xs text-amber-500 font-medium flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" /> Field inspection active
                            </p>
                        </div>
                    </div>

                    <div className="bg-primary/6 p-6 rounded-2xl space-y-3 hover:border-primary/40 transition-colors border-l-6 border-l-primary/80">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-muted uppercase tracking-wider">Avg Response Time</span>
                            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Calendar className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-3xl font-extrabold text-foreground">38.4 Hours</p>
                            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                                <ArrowUpRight className="w-3.5 h-3.5" /> 5.2h faster than average
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 bg-card border border-primary/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-custom pb-4">
                            <div>
                                <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-primary" />
                                    <span>Resolution vs Reported Issues Trend</span>
                                </h3>
                                <p className="text-xs text-muted mt-0.5">
                                    Comparative monthly breakdown of incoming civic reports versus completed repairs.
                                </p>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-primary inline-block" /> Reported
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" /> Resolved
                                </span>
                            </div>
                        </div>

                        <div className="w-full h-90 pt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlyTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorReported" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Area type="monotone" dataKey="reported" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReported)" />
                                    <Area type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorResolved)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="lg:col-span-4 bg-card border border-primary/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                        <div className="border-b border-border-custom pb-4">
                            <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                                <PieChart className="w-5 h-5 text-primary" />
                                <span>Category Distribution</span>
                            </h3>
                            <p className="text-xs text-muted mt-0.5">Top complaint categories</p>
                        </div>

                        <div className="w-full h-55 relative flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={categoryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {categoryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-2 pt-2 border-t border-border-custom/50">
                            {categoryChartData.map((cat, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                                    <span className="flex items-center gap-2 text-foreground">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                        {cat.name}
                                    </span>
                                    <span className="text-muted">{cat.value.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-card border border-border-custom rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="border-b border-border-custom pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                                <Award className="w-5 h-5 text-primary" />
                                <span>Departmental SLA Target Performance</span>
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                                Performance efficiency of individual civic departments against resolution SLAs.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                        <div className="lg:col-span-7 w-full h-65">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={departmentSLA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                    <XAxis dataKey="dept" stroke="#888888" fontSize={11} tickLine={false} />
                                    <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                                    <Bar dataKey="solved" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={36} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="lg:col-span-5 space-y-3">
                            {departmentSLA.map((d, i) => (
                                <div key={i} className="bg-section border border-border-custom/80 p-3.5 rounded-xl space-y-1.5">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                        <span className="text-foreground">{d.dept}</span>
                                        <span className="text-primary">{d.rate}% SLA</span>
                                    </div>
                                    <div className="w-full h-2 bg-card rounded-full overflow-hidden">
                                        <div className="h-full bg-primary rounded-full" style={{ width: `${d.rate}%` }} />
                                    </div>
                                    <div className="flex justify-between text-[11px] text-muted pt-0.5">
                                        <span>Solved: {d.solved.toLocaleString()}</span>
                                        <span>Target: {d.target.toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="bg-border-custom/40 rounded-2xl p-6 sm:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-border-custom pb-5">
                        <div>
                            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-primary" />
                                <span>Ward-wise Master Data Matrix</span>
                            </h3>
                            <p className="text-xs text-muted mt-0.5">
                                Search, filter, and audit area-wise municipal complaint resolution progress.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search ward or location..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-section border border-border-custom rounded-xl text-xs text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            <div className="flex items-center gap-1.5 w-full sm:w-auto bg-section border border-border-custom px-3 py-1.5 rounded-xl">
                                <SlidersHorizontal className="w-3.5 h-3.5 text-primary shrink-0" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-transparent text-xs text-foreground font-semibold focus:outline-none cursor-pointer w-full"
                                >
                                    <option value="all">All Efficiency Levels</option>
                                    <option value="high">High SLA (≥ 90%)</option>
                                    <option value="optimal">Optimal SLA (85-89%)</option>
                                    <option value="low">Needs Attention (&lt; 85%)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-border-custom text-muted text-xs uppercase tracking-wider bg-section/60">
                                    <th className="py-3.5 px-4 font-bold">Ward Area</th>
                                    <th className="py-3.5 px-4 font-bold">Total Reports</th>
                                    <th className="py-3.5 px-4 font-bold">Resolved</th>
                                    <th className="py-3.5 px-4 font-bold">Pending</th>
                                    <th className="py-3.5 px-4 font-bold">Avg Response</th>
                                    <th className="py-3.5 px-4 font-bold">SLA Rate</th>
                                    <th className="py-3.5 px-4 font-bold text-right">Efficiency Tag</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-custom/60 text-xs sm:text-sm">
                                {filteredWards.length > 0 ? (
                                    filteredWards.map((item) => (
                                        <tr key={item.id} className="hover:bg-section/40 transition-colors">
                                            <td className="py-4 px-4 font-bold text-foreground flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-primary shrink-0" />
                                                <span>{item.ward}</span>
                                            </td>
                                            <td className="py-4 px-4 font-medium text-muted">{item.total.toLocaleString()}</td>
                                            <td className="py-4 px-4 font-bold text-emerald-500">{item.resolved.toLocaleString()}</td>
                                            <td className="py-4 px-4 font-bold text-amber-500">{item.pending.toLocaleString()}</td>
                                            <td className="py-4 px-4 font-medium text-foreground">{item.avgTimeHours} Hours</td>
                                            <td className="py-4 px-4 font-extrabold text-foreground">{item.slaRate}%</td>
                                            <td className="py-4 px-4 text-right">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-block ${item.slaRate >= 90
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : item.slaRate >= 85
                                                            ? "bg-primary/10 text-primary"
                                                            : "bg-amber-500/10 text-amber-500"
                                                        }`}
                                                >
                                                    {item.slaRate >= 90 ? "High Efficiency" : item.slaRate >= 85 ? "Optimal" : "Needs Review"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="text-center py-8 text-muted text-xs">
                                            No ward matching your search query or status filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

            </div>
        </section>
    );
}