"use client";

import { useState } from "react";
import {
    Filter,
    LayoutGrid,
    Building2,
    Map,
    Road,
    MapPin,
    Home,
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
import type { FilterValues } from "@/types"

const initialFilters: FilterValues = {
    category: "",
    municipality: "",
    ward: "",
    road: "",
    postalCode: "",
    address: "",
};

export default function FilterPostsCard() {
    const [filters, setFilters] = useState<FilterValues>(initialFilters);

    const updateFilter = <K extends keyof FilterValues>(
        key: K,
        value: FilterValues[K],
    ) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleReset = () => {
        setFilters(initialFilters);
    };

    const handleApplyFilters = () => {
        console.log("Applied filters:", filters);
    };

    return (
        <div className="w-full space-y-3 rounded-2xl border border-border-custom bg-section p-4 shadow-xs">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-base font-bold text-foreground">
                    <Filter className="h-5 w-5 fill-primary text-primary" />
                    <span>Filter Posts</span>
                </div>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={handleReset}
                    className="h-auto p-0 pr-2 text-sm font-semibold text-primary hover:bg-transparent hover:text-primary hover:underline"
                >
                    Reset
                </Button>
            </div>

            <div className="space-y-3">
                <div className="space-y-1.5">
                    <Label
                        htmlFor="category"
                        className="sr-only"
                    >
                        Category
                    </Label>

                    <div className="relative">
                        <LayoutGrid className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />

                        <Select
                            value={filters.category}
                            onValueChange={(value) =>
                                updateFilter("category", value ?? "")
                            }
                        >
                            <SelectTrigger
                                id="category"
                                className="h-10 w-full rounded border-border-custom/90 bg-card pl-11 pr-3 text-xs font-medium text-foreground/80 shadow-2xs focus:ring-1 focus:ring-primary"
                            >
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="roads">
                                    Roads
                                </SelectItem>

                                <SelectItem value="water">
                                    Water & Sewer
                                </SelectItem>

                                <SelectItem value="flooding">
                                    Stormwater & Flooding
                                </SelectItem>

                                <SelectItem value="sidewalks">
                                    Sidewalks
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor="municipality"
                        className="sr-only"
                    >
                        City / Municipality
                    </Label>

                    <div className="relative">
                        <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />

                        <Select
                            value={filters.municipality}
                            onValueChange={(value) =>
                                updateFilter("municipality", value ?? "")
                            }
                        >
                            <SelectTrigger
                                id="municipality"
                                className="h-10 w-full rounded border-border-custom/90 bg-card pl-11 pr-3 text-xs font-medium text-foreground/80 shadow-2xs focus:ring-1 focus:ring-primary"
                            >
                                <SelectValue placeholder="Select City / Municipality" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="toronto">
                                    Toronto
                                </SelectItem>

                                <SelectItem value="scarborough">
                                    Scarborough
                                </SelectItem>

                                <SelectItem value="north-york">
                                    North York
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor="ward"
                        className="sr-only"
                    >
                        Ward
                    </Label>

                    <div className="relative">
                        <Map className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />

                        <Select
                            value={filters.ward}
                            onValueChange={(value) =>
                                updateFilter("ward", value ?? "")
                            }
                        >
                            <SelectTrigger
                                id="ward"
                                className="h-10 w-full rounded border-border-custom/90 bg-card pl-11 pr-3 text-xs font-medium text-foreground/80 shadow-2xs focus:ring-1 focus:ring-primary"
                            >
                                <SelectValue placeholder="Select Ward" />
                            </SelectTrigger>

                            <SelectContent>
                                <SelectItem value="1">
                                    Ward 1
                                </SelectItem>

                                <SelectItem value="2">
                                    Ward 2
                                </SelectItem>

                                <SelectItem value="3">
                                    Ward 3
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor="road"
                        className="sr-only"
                    >
                        Road / Street Name
                    </Label>

                    <div className="relative">
                        <Road className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />

                        <Input
                            id="road"
                            name="road"
                            type="text"
                            value={filters.road}
                            onChange={(event) =>
                                updateFilter("road", event.target.value)
                            }
                            placeholder="Road / Street Name"
                            className="h-10 rounded border-border-custom/90 bg-card pl-11 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor="postal-code"
                        className="sr-only"
                    >
                        Postal Code
                    </Label>

                    <div className="relative">
                        <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />

                        <Input
                            id="postal-code"
                            name="postalCode"
                            type="text"
                            value={filters.postalCode}
                            onChange={(event) =>
                                updateFilter(
                                    "postalCode",
                                    event.target.value,
                                )
                            }
                            placeholder="Postal Code"
                            className="h-10 rounded border-border-custom/90 bg-card pl-11 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <Label
                        htmlFor="address"
                        className="sr-only"
                    >
                        Address / Property
                    </Label>

                    <div className="relative">
                        <Home className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-foreground/70" />

                        <Input
                            id="address"
                            name="address"
                            type="text"
                            value={filters.address}
                            onChange={(event) =>
                                updateFilter("address", event.target.value)
                            }
                            placeholder="Address / Property"
                            className="h-10 rounded border-border-custom/90 bg-card pl-11 text-xs font-medium text-foreground shadow-2xs placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary"
                        />
                    </div>
                </div>

                <Button
                    type="button"
                    onClick={handleApplyFilters}
                    className="mt-1 h-10 w-full rounded-sm bg-primary text-xs font-semibold text-white shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99]"
                >
                    Apply Filters
                </Button>
            </div>
        </div>
    );
}
