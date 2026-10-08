"use client";

import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect, useCallback } from "react";
import {
    Search,
    Filter,
    Plus,
    Building2,
    Tag,
    X,
    Loader2,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ReportFiltersProps } from "@/types/report"

type FilterKey = "search" | "category" | "status" | "ward";

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
        (key: FilterKey, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());

            if (value && value !== "All") {
                params.set(key, value);
            } else {
                params.delete(key);
            }

            params.delete("page");

            const queryString = params.toString();
            const targetUrl = queryString
                ? `${pathname}?${queryString}`
                : pathname;

            startTransition(() => {
                router.push(targetUrl);
            });
        },
        [searchParams, pathname, router]
    );

    useEffect(() => {
        if (searchValue === searchQuery) {
            return;
        }

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
        <div className="relative space-y-4 rounded-2xl border border-border bg-muted/30 p-4 shadow-sm sm:p-5">
            {isPending && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-background/50 backdrop-blur-[1px]">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
            )}

            <div className="flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                    <Input
                        type="text"
                        placeholder="Search by report title, id or location..."
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="rounded-md border-border bg-background py-5 pl-10 pr-10 text-xs sm:text-sm"
                    />

                    {searchValue && (
                        <button
                            type="button"
                            onClick={handleClearSearch}
                            aria-label="Clear search input"
                            className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-1 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                <Link href="/report-issue" className="shrink-0">
                    <Button className="w-full gap-2 rounded-md py-5 text-xs font-bold sm:w-auto sm:text-sm">
                        <Plus className="h-4 w-4" />
                        <span>Report an Issue</span>
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-border/60 pt-3 sm:grid-cols-3">
                <div className="space-y-1">
                    <label
                        htmlFor="category-select"
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                        <Tag className="h-3 w-3 text-primary" />
                        Category
                    </label>

                    <Select
                        value={selectedCategory}
                        onValueChange={(value) =>
                            updateFilter("category", value)
                        }
                    >
                        <SelectTrigger
                            id="category-select"
                            className="w-full rounded-md border-border bg-background py-4 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>

                        <SelectContent>
                            {categories.map((category, index) => {
                                const categorySlug =
                                    typeof category === "string"
                                        ? category
                                        : category.slug;

                                const categoryName =
                                    typeof category === "string"
                                        ? category
                                        : category.name;

                                return (
                                    <SelectItem
                                        key={categorySlug || index}
                                        value={categorySlug}
                                        className="px-4 py-2 text-xs"
                                    >
                                        {categoryName}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label
                        htmlFor="status-select"
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                        <Filter className="h-3 w-3 text-primary" />
                        Status
                    </label>

                    <Select
                        value={selectedStatus}
                        onValueChange={(value) =>
                            updateFilter("status", value)
                        }
                    >
                        <SelectTrigger
                            id="status-select"
                            className="w-full rounded-md border-border bg-background py-4 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>

                        <SelectContent>
                            {statuses.map((status) => (
                                <SelectItem
                                    key={status}
                                    value={status}
                                    className="px-4 py-2 text-xs"
                                >
                                    {status}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-1">
                    <label
                        htmlFor="ward-select"
                        className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                    >
                        <Building2 className="h-3 w-3 text-primary" />
                        Ward / Region
                    </label>

                    <Select
                        value={selectedWard}
                        onValueChange={(value) =>
                            updateFilter("ward", value)
                        }
                    >
                        <SelectTrigger
                            id="ward-select"
                            className="w-full rounded-md border-border bg-background py-4 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Ward" />
                        </SelectTrigger>

                        <SelectContent>
                            {wards.map((ward, index) => {
                                const wardCode =
                                    typeof ward === "string"
                                        ? ward
                                        : ward.code;

                                const wardName =
                                    typeof ward === "string"
                                        ? ward
                                        : ward.name;

                                return (
                                    <SelectItem
                                        key={wardCode || index}
                                        value={wardCode}
                                        className="px-4 py-2 text-xs"
                                    >
                                        {wardName}
                                    </SelectItem>
                                );
                            })}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
}

