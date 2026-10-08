"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Filter,
    LayoutGrid,
    CheckCircle2,
    Map,
    Road,
    MapPin,
    Home,
    Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { FilterValues, FilterPostsCardClientProps } from "@/types/report";


const defaultFilters: FilterValues = {
    category: "All",
    status: "All",
    ward: "All",
    road: "",
    postalCode: "",
    address: "",
};

export default function FilterPostsCardClient({
    initialOptions,
}: FilterPostsCardClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [filters, setFilters] = useState<FilterValues>({
        category: searchParams.get("category") || "All",
        status: searchParams.get("status") || "All",
        ward: searchParams.get("ward") || "All",
        road: searchParams.get("road") || "",
        postalCode: searchParams.get("postalCode") || "",
        address: searchParams.get("address") || "",
    });

    const updateFilter = <K extends keyof FilterValues>(
        key: K,
        value: FilterValues[K]
    ) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleReset = () => {
        setFilters(defaultFilters);
        startTransition(() => {
            router.push("/reports");
        });
    };

    const handleApplyFilters = () => {
        const query = new URLSearchParams();

        if (filters.category && filters.category !== "All") {
            query.set("category", filters.category);
        }
        if (filters.status && filters.status !== "All") {
            query.set("status", filters.status);
        }
        if (filters.ward && filters.ward !== "All") {
            query.set("ward", filters.ward);
        }
        if (filters.road.trim()) {
            query.set("road", filters.road.trim());
        }
        if (filters.postalCode.trim()) {
            query.set("postalCode", filters.postalCode.trim());
        }
        if (filters.address.trim()) {
            query.set("address", filters.address.trim());
        }

        const queryString = query.toString();
        const targetUrl = queryString ? `/reports?${queryString}` : "/reports";

        startTransition(() => {
            router.push(targetUrl);
        });
    };

    return (
        <div className="relative w-full space-y-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
            {isPending && (
                <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-20">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Filter className="h-5 w-5 fill-primary text-primary" />
                    <span>Filter Posts</span>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    className="h-auto p-0 pr-2 text-sm font-semibold text-primary hover:bg-transparent hover:text-primary hover:underline cursor-pointer"
                >
                    Reset
                </Button>
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label htmlFor="category" className="sr-only">Category</Label>
                    <div className="relative">
                        <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                        <Select
                            value={filters.category}
                            onValueChange={(value) => updateFilter("category", value || "All")}
                        >
                            <SelectTrigger
                                id="category"
                                className="h-10 w-full rounded border-border bg-card pl-11 pr-3 text-xs font-medium text-foreground/80 shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Categories</SelectItem>
                                {initialOptions?.categories?.map((cat, idx) => {
                                    const val = typeof cat === "string" ? cat : cat.name || cat.value;
                                    return (
                                        <SelectItem key={idx} value={val} className="text-xs px-4 py-2">
                                            {val}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="status" className="sr-only">Status</Label>
                    <div className="relative">
                        <CheckCircle2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                        <Select
                            value={filters.status}
                            onValueChange={(value) => updateFilter("status", value || "All")}
                        >
                            <SelectTrigger
                                id="status"
                                className="h-10 w-full rounded border-border bg-card pl-11 pr-3 text-xs font-medium text-foreground/80 shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <SelectValue placeholder="Select Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All</SelectItem>
                                {initialOptions?.status && initialOptions.status.length > 0 ? (
                                    initialOptions.status.map((st, idx) => {
                                        const val = typeof st === "string" ? st : st.value || st.name;
                                        const label = typeof st === "string" ? st : st.name || st.value;
                                        return (
                                            <SelectItem key={idx} value={val} className="text-xs px-4 py-2">
                                                {label}
                                            </SelectItem>
                                        );
                                    })
                                ) : (
                                    <>
                                        <SelectItem value="pending" className="text-xs px-4 py-2">Pending</SelectItem>
                                        <SelectItem value="in_progress" className="text-xs px-4 py-2">In Progress</SelectItem>
                                        <SelectItem value="resolved" className="text-xs px-4 py-2">Resolved</SelectItem>
                                        <SelectItem value="rejected" className="text-xs px-4 py-2">Rejected</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="ward" className="sr-only">Ward</Label>
                    <div className="relative">
                        <Map className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                        <Select
                            value={filters.ward}
                            onValueChange={(value) => updateFilter("ward", value || "All")}
                        >
                            <SelectTrigger
                                id="ward"
                                className="h-10 w-full rounded border-border bg-card pl-11 pr-3 text-xs font-medium text-foreground/80 shadow-2xs focus:ring-1 focus:ring-primary cursor-pointer"
                            >
                                <SelectValue placeholder="Select Ward" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All Wards</SelectItem>
                                {initialOptions?.wards?.map((ward, idx) => {
                                    const val = typeof ward === "string" ? ward : ward.name || ward.value;
                                    return (
                                        <SelectItem key={idx} value={val} className="text-xs px-4 py-2">
                                            {val}
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="road" className="sr-only">Road / Street Name</Label>
                    <div className="relative">
                        <Road className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                        <Input
                            id="road"
                            name="road"
                            type="text"
                            value={filters.road}
                            onChange={(e) => updateFilter("road", e.target.value)}
                            placeholder="Road / Street Name"
                            className="h-10 rounded border-border bg-card pl-11 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="postal-code" className="sr-only">Postal Code</Label>
                    <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                        <Input
                            id="postal-code"
                            name="postalCode"
                            type="text"
                            value={filters.postalCode}
                            onChange={(e) => updateFilter("postalCode", e.target.value)}
                            placeholder="Postal Code"
                            className="h-10 rounded border-border bg-card pl-11 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label htmlFor="address" className="sr-only">Address / Property</Label>
                    <div className="relative">
                        <Home className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />
                        <Input
                            id="address"
                            name="address"
                            type="text"
                            value={filters.address}
                            onChange={(e) => updateFilter("address", e.target.value)}
                            placeholder="Address / Property"
                            className="h-10 rounded border-border bg-card pl-11 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <Button
                    type="button"
                    disabled={isPending}
                    onClick={handleApplyFilters}
                    className="mt-1 h-10 w-full rounded-md bg-primary text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary/90 active:scale-[0.99] cursor-pointer"
                >
                    {isPending ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Applying...
                        </span>
                    ) : (
                        "Apply Filters"
                    )}
                </Button>
            </div>
        </div>
    );
}