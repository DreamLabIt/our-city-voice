"use client";

import React from "react";
import { Search, Tag, Loader2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SEARCH_MAX_LENGTH } from "@/lib/search-config";
import type { ReportSearchInputProps } from "@/types/search";

export default function ReportSearchInput({
    search,
}: ReportSearchInputProps): React.JSX.Element {
    const hasQuery = search.query.length > 0;

    return (
        <div ref={search.containerRef} className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
                type="text"
                placeholder="Search by report title, id or location..."
                value={search.query}
                maxLength={SEARCH_MAX_LENGTH}
                onChange={(e) => search.handleInputChange(e.target.value)}
                onFocus={search.openDropdown}
                className="rounded-md border-border bg-background py-5 pl-10 pr-10 text-xs sm:text-sm"
            />

            {hasQuery && (
                <button
                    type="button"
                    onClick={search.clearQuery}
                    aria-label="Clear search input"
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted-foreground hover:text-foreground"
                >
                    <X className="h-4 w-4" />
                </button>
            )}

            {search.showDropdown && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-89 overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-xl no-scrollbar">
                    {search.status === "loading" ? (
                        <div className="flex items-center justify-center gap-2 p-5 text-xs text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                        </div>
                    ) : search.suggestions.length > 0 ? (
                        <div className="space-y-1">
                            {search.suggestions.map((suggestion) => (
                                <button
                                    key={suggestion.trackingCode}
                                    type="button"
                                    onClick={() =>
                                        search.fillQuery(suggestion.title)
                                    }
                                    className="group w-full cursor-pointer rounded-xl p-3 text-left transition hover:bg-muted/60"
                                >
                                    <p className="line-clamp-1 text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                                        {suggestion.title ||
                                            `Report #${suggestion.trackingCode}`}
                                    </p>

                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Tag className="h-3.5 w-3.5 shrink-0 text-primary" />
                                        {suggestion.trackingCode}
                                    </p>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-5 text-center text-xs text-muted-foreground">
                            No results found for &quot;
                            <span className="font-medium text-foreground">
                                {search.query.trim()}
                            </span>
                            &quot;
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}