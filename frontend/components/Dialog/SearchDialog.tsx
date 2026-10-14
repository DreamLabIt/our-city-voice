"use client";

import React, { useState } from "react";
import { Search, MapPin, Tag, ArrowRight, Loader2, } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useReportSearch } from "@/hooks/use-report-search";
import { SEARCH_MAX_LENGTH } from "@/lib/search-config";

export default function SearchDialog(): React.JSX.Element {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const search = useReportSearch({
        resetQueryOnNavigate: true,
        onNavigate: () => setIsOpen(false),
    });

    const hasQuery = search.query.trim().length > 0;

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);

        if (!open) {
            search.clearQuery();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger
                className="p-2 text-foreground/80 hover:text-primary hover:bg-section rounded-full transition cursor-pointer"
                aria-label="Search"
            >
                <Search className="w-6 h-6 stroke-[2.2]" />
            </DialogTrigger>

            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-border-custom rounded-2xl bg-card z-1000 pb-4">
                <form onSubmit={search.handleSubmit}>
                    <DialogHeader className="p-4 border-b border-border-custom ">
                        <DialogTitle className="sr-only">
                            Search OurCityVoice
                        </DialogTitle>

                        <div className="relative flex items-center">
                            <Search className="w-5 h-5 text-muted-foreground absolute left-3 pointer-events-none" />

                            <Input
                                type="text"
                                placeholder="Type to search reports, posts, or locations..."
                                value={search.query}
                                maxLength={SEARCH_MAX_LENGTH}
                                onChange={(e) =>
                                    search.handleInputChange(e.target.value)
                                }
                                className="pl-10 pr-10 py-6 border-0 focus-visible:ring-0 text-base bg-transparent shadow-none"
                                autoFocus
                            />

                            {search.isNavigating ? (
                                <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-muted-foreground" />
                            ) : (
                                hasQuery && (
                                    <button
                                        type="button"
                                        aria-label="Clear search"
                                        onClick={search.clearQuery}
                                        className="absolute right-3 p-1 hover:bg-section rounded-full text-muted-foreground hover:text-foreground transition cursor-pointer"
                                    >
                                    </button>
                                )
                            )}
                        </div>
                    </DialogHeader>
                </form>

                <div className="max-h-120 overflow-y-auto p-3 space-y-1 no-scrollbar">
                    {search.status === "idle" && (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Start typing to search reports, posts, or wards...
                        </div>
                    )}

                    {search.status === "loading" && (
                        <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Searching...
                        </div>
                    )}

                    {search.status === "ready" &&
                        (search.suggestions.length > 0 ? (
                            <>
                                {search.suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion.trackingCode}
                                        type="button"
                                        onClick={() =>
                                            search.openIssue(
                                                suggestion.trackingCode,
                                            )
                                        }
                                        className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-section transition cursor-pointer group"
                                    >
                                        <div className="space-y-1 min-w-0 pr-2">
                                            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                {suggestion.title ||
                                                    `Report #${suggestion.trackingCode}`}
                                            </p>

                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1 shrink-0">
                                                    <Tag className="w-3 h-3 text-primary" />
                                                    {suggestion.trackingCode}
                                                </span>

                                                <span className="flex items-center gap-1 truncate">
                                                    <MapPin className="w-3 h-3 shrink-0" />
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
                            </>
                        ) : (
                            <div className="p-6 text-center text-sm text-muted-foreground">
                                No results found for{" "}
                                <span className="text-primary font-medium">
                                    &quot;{search.query.trim()}&quot;
                                </span>
                            </div>
                        ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}