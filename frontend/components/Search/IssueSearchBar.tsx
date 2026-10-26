"use client";

import React from "react";
import { Search, MapPin, Tag, ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReportSearch } from "@/hooks/use-report-search";
import { SEARCH_MAX_LENGTH } from "@/lib/search-config";

export default function IssueSearchBar(): React.JSX.Element {
    const search = useReportSearch();

    return (
        <div className="bg-card/80 backdrop-blur-md p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-3 border border-border/50 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Find Issues
            </h2>

            <form
                onSubmit={search.handleSubmit}
                className="flex items-center gap-3 relative"
            >
                <div
                    onBlur={(event) => {
                        if (
                            !event.relatedTarget ||
                            !event.currentTarget.contains(
                                event.relatedTarget as Node,
                            )
                        ) {
                            search.closeDropdown();
                        }
                    }}
                    className="relative flex-1 flex items-center"
                >
                    <Search className="absolute left-3.5 sm:left-4 w-5 h-5 text-muted-foreground pointer-events-none stroke-2 z-10" />

                    <Input
                        type="text"
                        value={search.query}
                        maxLength={SEARCH_MAX_LENGTH}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            search.handleInputChange(e.target.value)
                        }
                        onFocus={search.openDropdown}
                        placeholder="Search by ID number, address, road, ward or keyword..."
                        className="w-full pl-11 pr-4 py-7 rounded-xl sm:rounded-2xl border-border bg-card text-foreground placeholder:text-muted-foreground text-sm sm:text-base focus-visible:ring-2 focus-visible:ring-primary shadow-xs"
                    />

                    {search.showDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50">
                            <ScrollArea className="max-h-88 w-full p-2 overflow-hidden">
                                {search.status === "loading" ? (
                                    <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Searching...
                                    </div>
                                ) : search.suggestions.length > 0 ? (
                                    <div className="space-y-1">
                                        {search.suggestions.map((suggestion) => (
                                            <button
                                                key={suggestion.trackingCode}
                                                type="button"
                                                onClick={() =>
                                                    search.openIssue(
                                                        suggestion.trackingCode,
                                                    )
                                                }
                                                className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-muted transition cursor-pointer group"
                                            >
                                                <div className="space-y-1 min-w-0 pr-2">
                                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                                        {suggestion.title ||
                                                            `Report #${suggestion.trackingCode}`}
                                                    </p>

                                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1 shrink-0">
                                                            <Tag className="w-3.5 h-3.5 text-primary" />{" "}
                                                            {suggestion.trackingCode}
                                                        </span>
                                                        <span className="flex items-center gap-1 truncate">
                                                            <MapPin className="w-3.5 h-3.5 shrink-0" />{" "}
                                                            <span className="truncate">
                                                                {suggestion.address ||
                                                                    "City Area"}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <ArrowRight className="w-4 h-4 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-6 text-center text-sm text-muted-foreground">
                                        No results found for &quot;
                                        <span className="text-primary font-medium">
                                            {search.query.trim()}
                                        </span>
                                        &quot;
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={search.isNavigating}
                    className="h-full px-6 sm:px-7 py-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-semibold shadow-md shrink-0 cursor-pointer"
                >
                    {search.isNavigating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        "Search"
                    )}
                </Button>
            </form>

            <p className="text-xs sm:text-[13px] text-muted-foreground font-medium">
                Example: #00123, Flooding during, Sheppard Ave
            </p>
        </div>
    );
}