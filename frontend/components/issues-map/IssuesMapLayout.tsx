"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
    MapPin,
    Search,
    Filter,
    Layers,
    ExternalLink,
    AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { posts } from "@/data/mock-data";
import { toMapPins } from "@/lib/map";
import { STATUS_META } from "@/lib/status";
import type { IssueMapPin, ReportStatus } from "@/types";

const IssueMap = dynamic(
    () => import("./IssueMap"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-muted/40">
                <span className="text-sm text-muted-foreground">
                    Loading map...
                </span>
            </div>
        ),
    }
);

const getStatusBadge = (status: ReportStatus) => {
    const meta = STATUS_META[status];
    const Icon = meta.icon;

    return (
        <Badge className={`gap-1 font-medium ${meta.badge}`}>
            <Icon className="w-3 h-3" />
            {status}
        </Badge>
    );
};

export default function IssuesMapLayout() {
    // Derived from the same reports the feed and the detail pages render.
    // Reports without coordinates drop out here, which is why the count is
    // shown below rather than left as a silent gap.
    const pins = useMemo(() => toMapPins(posts), []);
    const unmappedCount = posts.length - pins.length;

    const [searchQuery, setSearchQuery] = useState<string>("");
    // Deliberately nothing selected on load. Preselecting a pin makes the map
    // fly to it at zoom 15, which overrides the fit-to-bounds and opens the
    // page on one building instead of the whole city.
    const [selectedPin, setSelectedPin] = useState<IssueMapPin | null>(null);

    // IssueMap refits its viewport whenever this reference changes, so it has
    // to stay stable between renders that did not change the search.
    const filteredPins = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return pins;

        return pins.filter(
            (pin) =>
                pin.title.toLowerCase().includes(query) ||
                pin.address.toLowerCase().includes(query) ||
                pin.ward.toLowerCase().includes(query) ||
                pin.category.toLowerCase().includes(query) ||
                pin.code.toLowerCase().includes(query)
        );
    }, [pins, searchQuery]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] min-h-150">
            <div className="lg:col-span-4 xl:col-span-4 flex flex-col bg-card border border-border rounded-2xl shadow-sm overflow-hidden h-full">

                <div className="p-3 sm:p-4 border-b border-border space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <div className="p-2 bg-primary/10 text-primary rounded-lg shrink-0">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                                Reported Issues
                            </h2>
                        </div>
                        <Badge variant="outline" className="font-semibold text-xs px-2.5 py-4 rounded-sm whitespace-nowrap shrink-0">
                            Total : {filteredPins.length}
                        </Badge>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by title, address, ward or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-border h-10 sm:h-11 text-sm"
                        />
                    </div>

                    {unmappedCount > 0 && (
                        <p className="text-xs text-muted-foreground">
                            {unmappedCount} report{unmappedCount === 1 ? "" : "s"} have no
                            confirmed coordinates yet and are not shown on the map.
                        </p>
                    )}
                </div>

                <ScrollArea className="h-164.5 w-full p-3 sm:p-4">
                    <div className="space-y-4">
                        {filteredPins.length > 0 ? (
                            filteredPins.map((pin) => {
                                const isSelected = selectedPin?.id === pin.id;

                                return (
                                    <Card
                                        key={pin.id}
                                        onClick={() => setSelectedPin(pin)}
                                        className={`cursor-pointer transition-all duration-200 border hover:border-primary/50 ${isSelected
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border bg-card hover:bg-muted/30"
                                            }`}
                                    >
                                        <CardContent className="p-3 sm:p-4 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                                <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug flex-1">
                                                    {pin.title}
                                                </h3>

                                                <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                                                    <Badge variant="secondary" className="text-[11px] sm:text-xs font-normal">
                                                        {pin.category}
                                                    </Badge>
                                                    {getStatusBadge(pin.status)}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-border/50 gap-1.5 sm:gap-2">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="truncate">{pin.address}</span>
                                                </div>
                                                <span className="shrink-0 text-muted-foreground/80 text-[11px] sm:text-xs">
                                                    {pin.updatedAt}
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })
                        ) : (
                            <div className="text-center py-12 px-4 space-y-3">
                                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
                                <p className="text-sm text-muted-foreground">No issues found matching your criteria.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            <div className="lg:col-span-8 xl:col-span-8 relative bg-card border border-border rounded-2xl overflow-hidden flex flex-col h-full shadow-sm">
                <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
                    <div className="bg-background/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border shadow-md pointer-events-auto flex items-center gap-2">
                        <Layers className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Interactive City Map</span>
                    </div>

                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Button size="sm" variant="outline" className="bg-background/90 backdrop-blur-md shadow-md gap-1.5 text-xs">
                            <Filter className="w-3.5 h-3.5" />
                            <span>Map Layers</span>
                        </Button>
                    </div>
                </div>

                <div className="w-full h-full bg-muted/40 relative">
                    <IssueMap
                        pins={filteredPins}
                        selectedPin={selectedPin}
                        onSelectPin={setSelectedPin}
                    />

                    {selectedPin && (
                        <div className="absolute bottom-10 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-1000">
                            <Card className="bg-background/95 backdrop-blur-md border-border shadow-xl rounded-xl">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] mb-1"
                                            >
                                                {selectedPin.category}
                                            </Badge>

                                            <h4 className="font-bold text-base text-foreground leading-snug">
                                                {selectedPin.title}
                                            </h4>
                                        </div>

                                        {getStatusBadge(selectedPin.status)}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />

                                        <span>
                                            {selectedPin.address}
                                        </span>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-border gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {selectedPin.lat.toFixed(6)},{" "}
                                            {selectedPin.lng.toFixed(6)}
                                        </span>

                                        <Link
                                            href={`/issues/${selectedPin.id}`}
                                            className={buttonVariants({
                                                size: "sm",
                                                className: "gap-1.5 text-xs h-8",
                                            })}
                                        >
                                            <span>View Full Details</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
