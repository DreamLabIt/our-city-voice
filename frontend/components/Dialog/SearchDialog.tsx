"use client";

import React, { useMemo, useState } from "react";
import { Search, MapPin, Tag, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { SearchDialogProps } from "@/types/index";

export default function SearchDialog({ Reports = [] }: SearchDialogProps): React.JSX.Element {
    const [isOpen, setIsOpen] = useState<boolean>(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const router = useRouter();

    const filteredSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];

        const query = searchQuery.toLowerCase();

        return Reports.filter((report) => {
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
    }, [Reports, searchQuery]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);

        if (!open) {
            setSearchQuery("");
        }
    };

    const handleSelectReport = (trackingCode: string) => {
        setIsOpen(false);
        setSearchQuery("");
        if (trackingCode) {
            router.push(`/issues/${trackingCode}`);
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
                <DialogHeader className="p-4 border-b border-border-custom ">
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
                            />
                        )}
                    </div>
                </DialogHeader>

                <div className="max-h-120 overflow-y-auto p-3 space-y-1 no-scrollbar">
                    {!searchQuery.trim() ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            Start typing to search reports, posts, or wards...
                        </div>
                    ) : filteredSuggestions.length > 0 ? (
                        filteredSuggestions.map((report) => {
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
                                    onClick={() => handleSelectReport(report.trackingCode)}
                                    className="flex items-center justify-between p-3 rounded-xl hover:bg-section transition cursor-pointer group"
                                >
                                    <div className="space-y-1 min-w-0 pr-2">
                                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                            {report.title || `Report #${report.trackingCode}`}
                                        </p>

                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1 shrink-0">
                                                <Tag className="w-3 h-3 text-primary" />
                                                {categoryName}
                                            </span>

                                            <span className="flex items-center gap-1 truncate">
                                                <MapPin className="w-3 h-3 shrink-0" />
                                                <span className="truncate">{locationName}</span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge
                                            variant="secondary"
                                            className="capitalize text-[11px]"
                                        >
                                            {statusName}
                                        </Badge>

                                        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                            No results found for{" "}
                            <span className="text-foreground font-medium">
                                &quot;{searchQuery}&quot;
                            </span>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}