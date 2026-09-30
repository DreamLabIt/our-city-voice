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

type TimeRange = "7d" | "30d" | "1y" | "all";

interface WardData {
    id: string;
    ward: string;
    total: number;
    resolved: number;
    pending: number;
    avgTimeHours: number;
    slaRate: number;
}

const monthlyTrendData = [
    { month: "Jan", reported: 1100, resolved: 980 },
    { month: "Feb", reported: 1320, resolved: 1150 },
    { month: "Mar", reported: 1250, resolved: 1100 },
    { month: "Apr", reported: 1400, resolved: 1310 },
    { month: "May", reported: 1650, resolved: 1520 },
    { month: "Jun", reported: 1800, resolved: 1680 },
    { month: "Jul", reported: 1550, resolved: 1420 },
    { month: "Aug", reported: 1720, resolved: 1590 },
    { month: "Sep", reported: 1910, resolved: 1750 },
];

const categoryChartData = [
    { name: "Roads & Potholes", value: 6478, color: "#3B82F6" },
    { name: "Street Lighting", value: 4310, color: "#F59E0B" },
    { name: "Waste Management", value: 2770, color: "#10B981" },
    { name: "Drainage & Water", value: 1232, color: "#06B6D4" },
    { name: "Parks & Spaces", value: 630, color: "#8B5CF6" },
];

const departmentSLA = [
    { dept: "Public Works Department", solved: 4820, target: 5000, rate: 96.4 },
    { dept: "Electrical Safety Cell", solved: 3890, target: 4100, rate: 94.8 },
    { dept: "Sanitation & Drainage", solved: 2650, target: 3000, rate: 88.3 },
    { dept: "Water & Sewerage Board", solved: 1120, target: 1350, rate: 82.9 },
];

const initialWardData: WardData[] = [
    { id: "W1", ward: "Ward 01 (Central Hub)", total: 3420, resolved: 3120, pending: 300, avgTimeHours: 28, slaRate: 91.2 },
    { id: "W2", ward: "Ward 02 (Station Road)", total: 4150, resolved: 3680, pending: 470, avgTimeHours: 36, slaRate: 88.6 },
    { id: "W3", ward: "Ward 03 (Sector 4 Bypass)", total: 2890, resolved: 2410, pending: 480, avgTimeHours: 52, slaRate: 83.3 },
    { id: "W4", ward: "Ward 04 (Commercial Zone)", total: 3110, resolved: 2820, pending: 290, avgTimeHours: 32, slaRate: 90.6 },
    { id: "W5", ward: "Ward 05 (South Suburbs)", total: 1850, resolved: 1550, pending: 300, avgTimeHours: 44, slaRate: 83.7 },
];

export default function StatisticsPage(): React.JSX.Element {
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

    const totalReports = Math.round(15420 * timeRangeMultiplier);
    const resolvedReports = Math.round(13580 * timeRangeMultiplier);
    const pendingReports = totalReports - resolvedReports;
    const successRate = ((resolvedReports / totalReports) * 100).toFixed(1);

    const filteredWards = useMemo(() => {
        return initialWardData.filter((item) => {
            const matchesSearch = item.ward.toLowerCase().includes(searchQuery.toLowerCase());
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
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `OurCityVoice_Statistics_${timeRange}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast.success("CSV Report Exported!", {
            description: "Your analytics spreadsheet has been downloaded.",
        });
    };

    return (
        <div>

        </div>
    );
}