"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
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
    Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import type { IssueMapPin } from "@/types";
import type { Report } from "@/types/report";
import { getSearchResults } from "@/app/actions/search";

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

const PAGE_LIMIT = 6;
const MAX_WINDOW_ITEMS = PAGE_LIMIT * 3;
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

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [debouncedQuery, setDebouncedQuery] = useState<string>("");

    const [firstVisiblePage, setFirstVisiblePage] = useState<number>(1);
    const [lastVisiblePage, setLastVisiblePage] = useState<number>(1);

    const [hasMoreNext, setHasMoreNext] = useState<boolean>(true);
    const [isLoadingNextState, setIsLoadingNext] = useState<boolean>(false);
    const [isLoadingPrev, setIsLoadingPrev] = useState<boolean>(false);

    const [visiblePosts, setVisiblePosts] = useState<Report[]>([]);
    const [loadedQuery, setLoadedQuery] = useState<string | null>(null);
    const [failedQuery, setFailedQuery] = useState<string | null>(null);
    const [manualSelection, setManualSelection] = useState<{
        query: string | null;
        pin: IssueMapPin | null;
    } | null>(null);

    const cacheRef = useRef<Map<string, Report[]>>(new Map());
    const requestIdRef = useRef<number>(0);

    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
    const currentQuery = debouncedQuery.trim();
    const isLoadingNext = loadedQuery !== currentQuery || isLoadingNextState;
    const currentVisiblePosts = useMemo(
        () => (loadedQuery === currentQuery ? visiblePosts : []),
        [loadedQuery, currentQuery, visiblePosts],
    );
    const hasLoadError =
        loadedQuery === currentQuery && failedQuery === currentQuery;

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(searchQuery);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const loadPageData = useCallback(async (pageNum: number, query: string) => {
        const trimmedQuery = query.trim();
        const cacheKey = JSON.stringify([trimmedQuery, pageNum]);
        if (cacheRef.current.has(cacheKey)) {
            return cacheRef.current.get(cacheKey) ?? [];
        }

        if (trimmedQuery.length >= 2) {
            const res = await getSearchResults(trimmedQuery, pageNum, PAGE_LIMIT);
            if (res && res.posts) {
                cacheRef.current.set(cacheKey, res.posts);
                return res.posts;
            } else {
                return [];
            }
        } else {
            const start = (pageNum - 1) * PAGE_LIMIT;
            const end = start + PAGE_LIMIT;
            const sliced = AllPosts.slice(start, end);
            cacheRef.current.set(cacheKey, sliced);
            return sliced;
        }
    }, [AllPosts]);

    useEffect(() => {
        const currentReqId = ++requestIdRef.current;
        const query = currentQuery;

        cacheRef.current.clear();

        loadPageData(1, query).then((initialPosts) => {
            if (currentReqId === requestIdRef.current) {
                setFirstVisiblePage(1);
                setLastVisiblePage(1);
                setHasMoreNext(initialPosts.length === PAGE_LIMIT);
                setVisiblePosts(initialPosts);
                setFailedQuery(null);
                setLoadedQuery(query);
                setIsLoadingNext(false);
            }
        }).catch((error: unknown) => {
            if (currentReqId === requestIdRef.current) {
                console.error("Failed to load map reports:", error);
                setFirstVisiblePage(1);
                setLastVisiblePage(1);
                setHasMoreNext(false);
                setVisiblePosts([]);
                setFailedQuery(query);
                setLoadedQuery(query);
                setIsLoadingNext(false);
            }
        });
    }, [currentQuery, loadPageData]);

    const loadNextPage = useCallback(async () => {
        if (isLoadingNext || !hasMoreNext) return;

        setIsLoadingNext(true);
        const nextPageNum = lastVisiblePage + 1;
        const newPosts = await loadPageData(nextPageNum, debouncedQuery);

        if (newPosts.length > 0) {
            setVisiblePosts((prev) => {
                const combined = [...prev, ...newPosts];
                if (combined.length > MAX_WINDOW_ITEMS) {
                    return combined.slice(PAGE_LIMIT);
                }
                return combined;
            });

            if (lastVisiblePage - firstVisiblePage + 1 >= 3) {
                setFirstVisiblePage((prev) => prev + 1);
            }
            setLastVisiblePage(nextPageNum);

            if (newPosts.length < PAGE_LIMIT) {
                setHasMoreNext(false);
            }
        } else {
            setHasMoreNext(false);
        }
        setIsLoadingNext(false);
    }, [lastVisiblePage, firstVisiblePage, isLoadingNext, hasMoreNext, debouncedQuery, loadPageData]);

    const loadPreviousPage = useCallback(async () => {
        if (isLoadingPrev || firstVisiblePage <= 1) return;

        const viewport = scrollContainerRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]",
        ) as HTMLDivElement | null;

        if (!viewport) return;

        setIsLoadingPrev(true);

        const previousScrollHeight = viewport.scrollHeight;
        const previousScrollTop = viewport.scrollTop;
        const targetPageNum = firstVisiblePage - 1;

        try {
            const previousPosts = await loadPageData(targetPageNum, debouncedQuery);

            if (previousPosts.length > 0) {
                setVisiblePosts((currentPosts) => {
                    const merged = [...previousPosts, ...currentPosts];
                    if (merged.length > MAX_WINDOW_ITEMS) {
                        return merged.slice(0, MAX_WINDOW_ITEMS);
                    }
                    return merged;
                });

                setFirstVisiblePage(targetPageNum);
                if (lastVisiblePage - targetPageNum + 1 > 3) {
                    setLastVisiblePage((prev) => prev - 1);
                }
                setHasMoreNext(true);

                requestAnimationFrame(() => {
                    const updatedViewport = scrollContainerRef.current?.querySelector(
                        "[data-radix-scroll-area-viewport]",
                    ) as HTMLDivElement | null;

                    if (updatedViewport) {
                        const heightDifference = updatedViewport.scrollHeight - previousScrollHeight;
                        updatedViewport.scrollTop = previousScrollTop + heightDifference;
                    }
                    setIsLoadingPrev(false);
                });
            } else {
                setIsLoadingPrev(false);
            }
        } catch (error) {
            console.error("Failed to load previous page:", error);
            setIsLoadingPrev(false);
        }
    }, [firstVisiblePage, lastVisiblePage, isLoadingPrev, debouncedQuery, loadPageData]);

    useEffect(() => {
        const target = bottomSentinelRef.current;
        if (!target) return;

        const viewportContainer = scrollContainerRef.current?.querySelector('[data-radix-scroll-area-viewport]');

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMoreNext && !isLoadingNext && !isLoadingPrev) {
                    loadNextPage();
                }
            },
            {
                root: viewportContainer || null,
                rootMargin: "150px",
                threshold: 0.1,
            }
        );

        observer.observe(target);

        return () => {
            observer.disconnect();
        };
    }, [hasMoreNext, isLoadingNext, isLoadingPrev, loadNextPage]);

    useEffect(() => {
        const target = topSentinelRef.current;
        const viewport = scrollContainerRef.current?.querySelector(
            "[data-radix-scroll-area-viewport]",
        );

        if (!target || !viewport) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    firstVisiblePage > 1 &&
                    !isLoadingPrev &&
                    !isLoadingNext
                ) {
                    void loadPreviousPage();
                }
            },
            {
                root: viewport,
                rootMargin: "150px 0px 0px 0px",
                threshold: 0.01,
            },
        );

        observer.observe(target);

        return () => observer.disconnect();
    }, [firstVisiblePage, isLoadingPrev, isLoadingNext, loadPreviousPage]);

    const pins = useMemo<IssueMapPin[]>(() => {
        const mapped: IssueMapPin[] = [];

        for (const report of currentVisiblePosts) {
            const lat = report.latitude;
            const lng = report.longitude;

            if (lat === null || lng === null) continue;
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
            if (lat === 0 && lng === 0) continue;

            mapped.push({
                id: report.id,
                trackingCode: report.trackingCode,
                title: report.title,
                address: report.address || "Location not specified",
                ward: report.ward?.name || "N/A",
                category: report.category?.name || "N/A",
                status: report.status,
                lat,
                lng,
                updatedAt: getTimeAgo(report.updatedAt),
            });
        }

        return mapped;
    }, [currentVisiblePosts]);

    const targetCode = queryTrackingCode || queryId;
    const queryMatchedPin = useMemo(() => {
        if (!targetCode) return null;
        return pins.find(
            (pin) =>
                pin.trackingCode.toLowerCase() === targetCode.toLowerCase() ||
                pin.id.toLowerCase() === targetCode.toLowerCase(),
        ) ?? null;
    }, [pins, targetCode]);
    const selectedPin =
        manualSelection?.query === targetCode
            ? manualSelection.pin
            : queryMatchedPin;
    const selectPin = useCallback((pin: IssueMapPin | null) => {
        setManualSelection({ query: targetCode, pin });
    }, [targetCode]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-150">
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-full">

                <div className="p-3 sm:p-4 border-b border-border space-y-3 bg-muted/30 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                                Reported Issues
                            </h2>
                        </div>
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
                </div>

                <div ref={scrollContainerRef} className="flex-1 min-h-0 w-full overflow-hidden">
                    <ScrollArea className="h-full w-full">
                        <div className="p-3 sm:p-4 space-y-4">
                            {currentVisiblePosts.length > 0 ? (
                                currentVisiblePosts.map((post) => {
                                    const isSelected = selectedPin?.id === post.id;
                                    const categoryName = post.category?.name || "N/A";
                                    const addressText = post.address || "Location not specified";
                                    const timeAgoText = getTimeAgo(post.updatedAt);

                                    return (
                                        <Card
                                            key={post.id}
                                            onClick={() => {
                                                const matched = pins.find(p => p.id === post.id);
                                                if (matched) selectPin(matched);
                                            }}
                                            className={`cursor-pointer transition-all duration-200 border hover:border-primary/50 ${isSelected
                                                ? "border-primary bg-primary/5 shadow-sm"
                                                : "border-border bg-card hover:bg-muted/30"
                                                }`}
                                        >
                                            <CardContent className="p-3 sm:p-4 space-y-3">
                                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                                    <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug flex-1">
                                                        {post.title}
                                                    </h3>

                                                    <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                                                        <Badge className="bg-sky-600 hover:bg-sky-700 text-white text-[11px] sm:text-xs font-medium rounded-full px-2.5 py-0.5 border-none shadow-2xs">
                                                            {categoryName}
                                                        </Badge>
                                                        {getStatusBadge(post.status)}
                                                    </div>
                                                </div>

                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-border/50 gap-1.5 sm:gap-2">
                                                    <div className="flex items-center gap-1 min-w-0">
                                                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                        <span className="truncate">{addressText}</span>
                                                    </div>
                                                    <span className="shrink-0 text-muted-foreground/80 text-[11px] sm:text-xs">
                                                        {timeAgoText}
                                                    </span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            ) : (
                                !isLoadingNext && !isLoadingPrev && (
                                    <div className="text-center py-12 px-4 space-y-3">
                                        <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                                        <p
                                            className="text-sm text-muted-foreground"
                                            role={hasLoadError ? "alert" : undefined}
                                        >
                                            {hasLoadError
                                                ? "Could not load issues. Please try again."
                                                : "No issues found matching your criteria."}
                                        </p>
                                    </div>
                                )
                            )}

                            <div ref={bottomSentinelRef} className="py-2 text-center min-h-10 flex items-center justify-center">
                                {isLoadingNext && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                        <span>Loading page {lastVisiblePage + 1}...</span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </ScrollArea>
                </div>
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
                        pins={pins}
                        selectedPin={selectedPin}
                        onSelectPin={selectPin}
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