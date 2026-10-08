"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useCallback } from "react";
import { Search, Filter, Plus, Building2, Tag, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ReportFiltersProps {
    searchQuery: string;
    selectedCategory: string;
    selectedStatus: string;
    selectedWard: string;
    categories: string[];
    statuses: string[];
    wards: string[];
}

export default function ReportFilters({
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedWard,
    categories,
    statuses,
    wards,
}: ReportFiltersProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const [searchValue, setSearchValue] = useState(searchQuery);

    useEffect(() => {
        setSearchValue(searchQuery);
    }, [searchQuery]);

    const updateFilter = useCallback(
        (key: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value && value !== "All") {
                params.set(key, value);
            } else {
                params.delete(key);
            }

            params.delete("page");

            startTransition(() => {
                router.push(`${pathname}?${params.toString()}`);
            });
        },
        [searchParams, pathname, router]
    );

    useEffect(() => {
        if (searchValue === searchQuery) return;

        const timer = setTimeout(() => {
            updateFilter("search", searchValue);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchValue, searchQuery, updateFilter]);

    const handleClearSearch = () => {
        setSearchValue("");
        updateFilter("search", "");
    };

    return (
        <div className="bg-muted/30 p-4 sm:p-5 rounded-2xl border border-border shadow-sm space-y-4 relative">
            {isPending && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search by report title, id or location..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10 pr-10 bg-background border-border rounded-md text-xs sm:text-sm py-5"
                    />
                    {searchValue && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            aria-label="Clear search input"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer rounded-md p-1"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <Link href="/report-issue" className="shrink-0">
                    <Button className="w-full sm:w-auto gap-2 rounded-md text-xs sm:text-sm font-bold py-5">
                        <Plus className="w-4 h-4" />
                        <span>Report an Issue</span>
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-border/60">
                <div className="space-y-1">
                    <label
                        htmlFor="category-select"
                        className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"
                    >
                        <Tag className="w-3 h-3 text-primary" /> Category
                    </label>

                    <Select
                        value={selectedCategory}
                        onValueChange={(value) => updateFilter("category", value)}
                    >
                        <SelectTrigger
                            id="category-select"
                            className="bg-background border-border rounded-md w-full py-4 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>

                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs px-4 py-2">
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label
                        htmlFor="status-select"
                        className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"
                    >
                        <Filter className="w-3 h-3 text-primary" /> Status
                    </label>

                    <Select
                        value={selectedStatus}
                        onValueChange={(value) => updateFilter("status", value)}
                    >
                        <SelectTrigger
                            id="status-select"
                            className="bg-background border-border rounded-md w-full py-4 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>

                        <SelectContent>
                            {statuses.map((st) => (
                                <SelectItem key={st} value={st} className="text-xs px-4 py-2">
                                    {st}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label
                        htmlFor="ward-select"
                        className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1"
                    >
                        <Building2 className="w-3 h-3 text-primary" /> Ward / Region
                    </label>

                    <Select
                        value={selectedWard}
                        onValueChange={(value) => updateFilter("ward", value)}
                    >
                        <SelectTrigger
                            id="ward-select"
                            className="bg-background border-border rounded-md w-full py-4 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Ward" />
                        </SelectTrigger>

                        <SelectContent>
                            {wards.map((w) => (
                                <SelectItem key={w} value={w} className="text-xs px-4 py-2">
                                    {w}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}