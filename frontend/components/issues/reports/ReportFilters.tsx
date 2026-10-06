"use client";

import Link from "next/link";
import { Search, Filter, Plus, Building2, Tag, X } from "lucide-react";
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
    setSearchQuery: (query: string) => void;
    selectedCategory: string;
    setSelectedCategory: (cat: string) => void;
    selectedStatus: string;
    setSelectedStatus: (status: string) => void;
    selectedWard: string;
    setSelectedWard: (ward: string) => void;
    categories: string[];
    statuses: string[];
    wards: string[];
}

export default function ReportFilters({
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    selectedWard,
    setSelectedWard,
    categories,
    statuses,
    wards,
}: ReportFiltersProps) {
    return (
        <div className="bg-muted/30 p-4 sm:p-5 rounded-2xl border border-border shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        type="text"
                        placeholder="Search by report title, id or location..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-10 bg-background border-border rounded-md text-xs sm:text-sm py-5"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            aria-label="Clear search input"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer rounded-md py-5"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <Link href="/report-issue" className="shrink-0">
                    <Button className="w-full sm:w-auto gap-2 rounded-md  text-xs sm:text-sm font-bold py-5">
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
                        onValueChange={(value) => setSelectedCategory(value ?? "")}
                    >
                        <SelectTrigger
                            id="category-select"
                            className="bg-background border-border rounded-md w-full py-5 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Category" />
                        </SelectTrigger>

                        <SelectContent>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat} className="text-xs">
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
                        onValueChange={(value) => setSelectedStatus(value ?? "")}
                    >
                        <SelectTrigger
                            id="status-select"
                            className="bg-background border-border rounded-md w-full py-5 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Status" />
                        </SelectTrigger>

                        <SelectContent>
                            {statuses.map((st) => (
                                <SelectItem key={st} value={st} className="text-xs">
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
                        onValueChange={(value) => setSelectedWard(value ?? "")}
                    >
                        <SelectTrigger
                            id="ward-select"
                            className="bg-background border-border rounded-md w-full py-5 text-xs font-semibold"
                        >
                            <SelectValue placeholder="Select Ward" />
                        </SelectTrigger>

                        <SelectContent>
                            {wards.map((w) => (
                                <SelectItem key={w} value={w} className="text-xs">
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