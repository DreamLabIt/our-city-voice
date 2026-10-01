"use client";

import React, { useMemo, useState } from "react";
import { Search, MapPin, Tag, ArrowRight } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { mockSuggestions } from "@/data/mock-data";

export default function SearchDialog(): React.JSX.Element {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();

        return mockSuggestions.filter(
            (item) =>
                item.id.toLowerCase().includes(query) ||
                item.title.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);

        if (!open) {
            setSearchQuery("");
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            {/* Search Trigger */}
            <DialogTrigger
                className="p-2 text-foreground/80 hover:text-primary hover:bg-section rounded-full transition cursor-pointer"
                aria-label="Search"
            >
                <Search className="w-6 h-6 stroke-[2.2]" />
            </DialogTrigger>

            {/* Search Dialog */}
            <DialogContent className="sm:max-w-xl p-0 gap-0 overflow-hidden border-border-custom rounded-2xl bg-card">
                <DialogHeader className="p-4 border-b border-border-custom">
                    <DialogTitle className="sr-only">
                        Search OurCityVoice
                    </DialogTitle>

                    <div className="relative flex items-center">
                        <Search className="w-5 h-5 text-muted-foreground absolute left-3 pointer-events-none" />

                        <Input
                            type="text"
                            placeholder="Type to search reports, posts, or locations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-10 py-6 border-0 focus-visible:ring-0 text-base bg-transparent shadow-none"
                            autoFocus
                        />

                        {searchQuery && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 p-1 hover:bg-section rounded-full text-muted-foreground hover:text-foreground transition cursor-pointer"
                            >
                            </button>
                        )}
                    </div>
                </DialogHeader>

                <div className="max-h-87.5 overflow-y-auto p-3 space-y-1">
                    {!searchQuery.trim() ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Start typing to search reports, posts, or wards...
                        </div>
                    ) : filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => {
                                    setIsOpen(false);
                                    setSearchQuery("");
                                }}
                                className="flex items-center justify-between p-3 rounded-xl hover:bg-section transition cursor-pointer group"
                            >
                                <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                                        {item.title}
                                    </p>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Tag className="w-3 h-3 text-primary" />
                                            {item.category}
                                        </span>

                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {item.location}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge
                                        variant="secondary"
                                        className="capitalize text-[11px]"
                                    >
                                        {item.type}
                                    </Badge>

                                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No results found for{" "}
                            <span className="text-foreground font-medium">
                                "{searchQuery}"
                            </span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
