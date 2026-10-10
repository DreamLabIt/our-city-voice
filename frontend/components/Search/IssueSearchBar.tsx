"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import { Search, MapPin, Tag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IssueSearchBarProps } from "@/types";

export default function IssueSearchBar({ onSearch, AllPosts = [] }: IssueSearchBarProps): React.JSX.Element {
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const router = useRouter();

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const query = searchQuery.toLowerCase();

        return AllPosts.filter((report) => {
            const title = report.title || "";
            const trackingCode = report.trackingCode || "";
            const id = report.id || "";

            const categoryName =
                typeof report.category === "object"
                    ? report.category?.name || report.category?.slug || ""
                    : report.category || "";

            const locationName =
                typeof report.location === "object"
                    ? report.location?.address || ""
                    : report.location || "";

            const wardName =
                typeof report.ward === "object"
                    ? report.ward?.name || report.ward?.code || ""
                    : report.ward || "";

            return (
                title.toLowerCase().includes(query) ||
                trackingCode.toLowerCase().includes(query) ||
                id.toLowerCase().includes(query) ||
                categoryName.toLowerCase().includes(query) ||
                locationName.toLowerCase().includes(query) ||
                wardName.toLowerCase().includes(query)
            );
        });
    }, [AllPosts, searchQuery]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsDropdownOpen(false);
        if (onSearch) {
            onSearch(searchQuery);
        }
    };

    const handleSelectSuggestion = (trackingCode: string) => {
        setIsDropdownOpen(false);
        setSearchQuery("");
        if (trackingCode) {
            router.push(`/issues/${trackingCode}`);
        }
    };

    return (
        <div className="bg-card/80 backdrop-blur-md p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-3 border border-border/50 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Find Issues
            </h2>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 relative">
                <div ref={searchContainerRef} className="relative flex-1 flex items-center">
                    <Search className="absolute left-3.5 sm:left-4 w-5 h-5 text-muted-foreground pointer-events-none stroke-2 z-10" />

                    <Input
                        type="text"
                        value={searchQuery}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setSearchQuery(e.target.value);
                            setIsDropdownOpen(true);
                        }}
                        onFocus={() => {
                            if (searchQuery.trim()) setIsDropdownOpen(true);
                        }}
                        placeholder="Search by ID number, address, road, ward or keyword..."
                        className="w-full pl-11 pr-4 py-7 rounded-xl sm:rounded-2xl border-border bg-card text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                    />

                    {isDropdownOpen && searchQuery.trim().length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                            <ScrollArea className="max-h-100 w-full p-2 overflow-hidden">
                                {filteredSuggestions.length > 0 ? (
                                    <div className="space-y-1">
                                        {filteredSuggestions.map((report) => {
                                            const categoryName =
                                                typeof report.category === "object"
                                                    ? report.category?.name || "General"
                                                    : report.category || "General";

                                            const locationName =
                                                typeof report.location === "object"
                                                    ? report.location?.address || "City Area"
                                                    : report.location || "City Area";

                                            const statusName =
                                                typeof report.status === "string" ? report.status : "Pending";

                                            return (
                                                <div
                                                    key={report.id || report.trackingCode}
                                                    onClick={() => handleSelectSuggestion(report.trackingCode)}
                                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/60 transition cursor-pointer group"
                                                >
                                                    <div className="space-y-1 min-w-0 pr-2">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                                {report.title || `Report #${report.trackingCode}`}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                            <span className="flex items-center gap-1 shrink-0">
                                                                <Tag className="w-3.5 h-3.5 text-primary" /> {categoryName}
                                                            </span>
                                                            <span className="flex items-center gap-1 truncate">
                                                                <MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{locationName}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <Badge variant="secondary" className="capitalize text-[11px] font-medium">
                                                            {statusName}
                                                        </Badge>
                                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        No results found for &quot;<span className="text-foreground font-medium">{searchQuery}</span>&quot;
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    className="h-full px-6 sm:px-7 py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold shadow-md shrink-0 cursor-pointer"
                >
                    Search
                </Button>
            </form>

            <p className="text-xs sm:text-[13px] text-muted-foreground font-medium">
                Example: #1024, Finch Ave, Ward 5, M1B 3J4
            </p>
        </div>
    );
}