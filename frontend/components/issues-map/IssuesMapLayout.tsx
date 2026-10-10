"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    MapPin,
    Search,
    Filter,
    Layers,
    ExternalLink,
    AlertCircle,
    Clock,
    CheckCircle2,
    XCircle,
    HelpCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import type { IssueMapPin } from "@/types";
import type { Report } from "@/types/report";

const IssueMap = dynamic(
    () => import("./IssueMap"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-muted/40">
                <span className="text-sm text-muted-foreground">
                    Loading map...
                </span>
            </div>
        ),
    }
);

const getStatusBadge = (status: string) => {
    const normalizeStatus = status.toLowerCase().replace("_", " ").replace("-", " ");

    let badgeStyle = "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800";
    let Icon = AlertCircle;
    let label = status;

    if (normalizeStatus.includes("pending")) {
        badgeStyle = "bg-blue-100/80 text-blue-600 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800";
        Icon = AlertCircle;
        label = "Pending";
    } else if (normalizeStatus.includes("progress")) {
        badgeStyle = "bg-amber-100/80 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800";
        Icon = Clock;
        label = "In Progress";
    } else if (normalizeStatus.includes("resolved") || normalizeStatus.includes("completed")) {
        badgeStyle = "bg-emerald-100/80 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800";
        Icon = CheckCircle2;
        label = "Resolved";
    } else if (normalizeStatus.includes("rejected") || normalizeStatus.includes("closed")) {
        badgeStyle = "bg-rose-100/80 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800";
        Icon = XCircle;
        label = "Rejected";
    } else {
        badgeStyle = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
        Icon = HelpCircle;
    }

    return (
        <Badge variant="outline" className={`gap-1 font-semibold text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full border shadow-2xs ${badgeStyle}`}>
            <Icon className="w-3 h-3 shrink-0 stroke-[2.5]" />
            <span>{label}</span>
        </Badge>
    );
};

const getTimeAgo = (dateString?: string) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) {
        const days = Math.floor(interval);
        return days === 1 ? "1 day ago" : `${days} days ago`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        const hours = Math.floor(interval);
        return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        const minutes = Math.floor(interval);
        return minutes === 1 ? "1 minute ago" : `${minutes} minutes ago`;
    }
    return "Just now";
};

export interface IssuesMapLayoutProps {
    AllPosts?: Report[];
}

export default function IssuesMapLayout({ AllPosts = [] }: IssuesMapLayoutProps) {
    const searchParams = useSearchParams();
    const queryTrackingCode = searchParams.get("trackingCode");
    const queryId = searchParams.get("id");

    const pins = useMemo(() => {
        if (!Array.isArray(AllPosts) || AllPosts.length === 0) return [];

        return AllPosts.map((report: any, index: number) => {
            const locationObj = report.location || {};

            const address =
                typeof locationObj === "object"
                    ? locationObj.address || `${locationObj.street || ""}, ${locationObj.city || ""}`.trim() || "Location not specified"
                    : String(report.location || "Location not specified");

            const category =
                typeof report.category === "object" && report.category !== null
                    ? report.category.name || report.category.slug || "General"
                    : String(report.category || "General");

            const ward =
                typeof report.ward === "object" && report.ward !== null
                    ? report.ward.name || report.ward.code || "N/A"
                    : String(report.ward || "N/A");

            const lat = Number(report.lat ?? report.latitude ?? locationObj.latitude ?? locationObj.lat ?? 0);
            const lng = Number(report.lng ?? report.longitude ?? locationObj.longitude ?? locationObj.lng ?? 0);

            return {
                id: String(report.id || report._id || report.trackingCode || ""),
                code: String(report.trackingCode || report.id || ""),
                title: String(report.title || "Untitled Report"),
                address: address,
                ward: ward,
                category: category,
                status: report.status || "pending",
                lat: lat !== 0 && !isNaN(lat) ? lat : 43.771568 + (index * 0.001),
                lng: lng !== 0 && !isNaN(lng) ? lng : -79.213000 + (index * 0.001),
                updatedAt: getTimeAgo(report.updatedAt || report.createdAt),
            };
        }) as IssueMapPin[];
    }, [AllPosts]);

    const unmappedCount = AllPosts.length - pins.length;
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedPin, setSelectedPin] = useState<IssueMapPin | null>(null);

    const filteredPins = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return pins;

        return pins.filter(
            (pin) =>
                pin.title.toLowerCase().includes(query) ||
                pin.address.toLowerCase().includes(query) ||
                pin.ward.toLowerCase().includes(query) ||
                pin.category.toLowerCase().includes(query) ||
                pin.code.toLowerCase().includes(query)
        );
    }, [pins, searchQuery]);

    useEffect(() => {
        const targetCode = queryTrackingCode || queryId;
        if (targetCode && pins.length > 0) {
            const matchedPin = pins.find(
                (pin) =>
                    pin.code.toLowerCase() === targetCode.toLowerCase() ||
                    pin.id.toLowerCase() === targetCode.toLowerCase()
            );

            if (matchedPin) {
                setSelectedPin(matchedPin);
            }
        }
    }, [queryTrackingCode, queryId, pins]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-150">
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-full">

                <div className="p-3 sm:p-4 border-b border-border space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                                Reported Issues
                            </h2>
                        </div>
                        <Badge variant="outline" className="font-semibold text-xs px-2.5 py-4 rounded-sm whitespace-nowrap shrink-0">
                            Total : {filteredPins.length}
                        </Badge>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by title, address, ward or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-border h-10 sm:h-11 text-sm"
                        />
                    </div>

                    {unmappedCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {unmappedCount} report{unmappedCount === 1 ? "" : "s"} have no
                            confirmed coordinates yet and are not shown on the map.
                        </p>
                    )}
                </div>

                <ScrollArea className="h-190 w-full p-3 sm:p-4">
                    <div className="space-y-4">
                        {filteredPins.length > 0 ? (
                            filteredPins.map((pin) => {
                                const isSelected = selectedPin?.id === pin.id;

                                return (
                                    <Card
                                        key={pin.id}
                                        onClick={() => setSelectedPin(pin)}
                                        className={`cursor-pointer transition-all duration-200 border hover:border-primary/50 ${isSelected
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border bg-card hover:bg-muted/30"
                                            }`}
                                    >
                                        <CardContent className="p-3 sm:p-4 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                                <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug flex-1">
                                                    {pin.title}
                                                </h3>

                                                <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                                                    <Badge className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] sm:text-xs font-medium rounded-full px-2.5 py-0.5 border-none shadow-2xs">
                                                        {pin.category}
                                                    </Badge>
                                                    {getStatusBadge(pin.status)}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-border/50 gap-1.5 sm:gap-2">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="truncate">{pin.address}</span>
                                                </div>
                                                <span className="shrink-0 text-muted-foreground/80 text-[11px] sm:text-xs">
                                                    {pin.updatedAt}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 px-4 space-y-3">
                                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground">No issues found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="lg:col-span-8 xl:col-span-8 relative bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border shadow-md pointer-events-auto flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Interactive City Map</span>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Button size="sm" variant="outline" className="bg-background/90 backdrop-blur-md shadow-md gap-1.5 text-xs">
                            <Filter className="w-3.5 h-3.5" />
                            <span>Map Layers</span>
                        </Button>
                    </div>
                </div>

                <div className="w-full h-full bg-muted/40 relative">
                    <IssueMap
                        pins={filteredPins}
                        selectedPin={selectedPin}
                        onSelectPin={setSelectedPin}
                    />

                    {selectedPin && (
                        <div className="absolute bottom-10 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-1000">
                            <Card className="bg-background/95 backdrop-blur-md border-border shadow-xl rounded-xl">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Badge
                                                className="bg-sky-600 text-white text-[10px] mb-1 rounded-full border-none"
                                            >
                                                {selectedPin.category}
                                            </Badge>

                                            <h4 className="font-bold text-base text-foreground leading-snug">
                                                {selectedPin.title}
                                            </h4>
                                        </div>

                                        {getStatusBadge(selectedPin.status)}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />

                                        <span>
                                            {selectedPin.address}
                                        </span>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-border gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {selectedPin.lat.toFixed(6)},{" "}
                                            {selectedPin.lng.toFixed(6)}
                                        </span>

                                        <Link
                                            href={`/issues/${selectedPin.id}`}
                                            className={buttonVariants({
                                                size: "sm",
                                                className: "gap-1.5 text-xs h-8",
                                            })}
                                        >
                                            <span>View Full Details</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}