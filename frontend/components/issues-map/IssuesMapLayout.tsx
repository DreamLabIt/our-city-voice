"use client";

import { useState } from "react";
import {
    MapPin,
    Search,
    Filter,
    Layers,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
import { mockIssues } from "@/data/mock-data";
import { Issue } from "@/types";

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


export default function IssuesMapLayout() {
    const [issues] = useState<Issue[]>(mockIssues);
    const [selectedIssue, setSelectedIssue] = useState<Issue | null>(mockIssues[0]);
    const [searchQuery, setSearchQuery] = useState<string>("");

    const filteredIssues = issues.filter(
        (issue) =>
            issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
            issue.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: Issue["status"]) => {
        switch (status) {
            case "Resolved":
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 gap-1 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                    </Badge>
                );
            case "In Progress":
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20 gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        In Progress
                    </Badge>
                );
            default:
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20 gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Pending
                    </Badge>
                );
        }
    };

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
                            Total : {filteredIssues.length}
                        </Badge>
                    </div>

                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search by title, category or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-background border-border h-10 sm:h-11 text-sm"
                        />
                    </div>
                </div>

                <ScrollArea className="h-164.5 w-full p-3 sm:p-4">
                    <div className="space-y-4">
                        {filteredIssues.length > 0 ? (
                            filteredIssues.map((issue) => {
                                const isSelected = selectedIssue?.id === issue.id;

                                return (
                                    <Card
                                        key={issue.id}
                                        onClick={() => setSelectedIssue(issue)}
                                        className={`cursor-pointer transition-all duration-200 border hover:border-primary/50 ${isSelected
                                            ? "border-primary bg-primary/5 shadow-sm"
                                            : "border-border bg-card hover:bg-muted/30"
                                            }`}
                                    >
                                        <CardContent className="p-3 sm:p-4 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                                                <h3 className="font-semibold text-sm sm:text-base text-foreground line-clamp-2 leading-snug flex-1">
                                                    {issue.title}
                                                </h3>

                                                <div className="flex items-center flex-wrap gap-1.5 shrink-0">
                                                    <Badge variant="secondary" className="text-[11px] sm:text-xs font-normal">
                                                        {issue.category}
                                                    </Badge>
                                                    {getStatusBadge(issue.status)}
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-muted-foreground pt-2.5 border-t border-border/50 gap-1.5 sm:gap-2">
                                                <div className="flex items-center gap-1 min-w-0">
                                                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span className="truncate">{issue.location}</span>
                                                </div>
                                                <span className="shrink-0 text-muted-foreground/80 text-[11px] sm:text-xs">
                                                    {issue.createdAt}
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
                        issues={filteredIssues}
                        selectedIssue={selectedIssue}
                        onSelectIssue={setSelectedIssue}
                    />

                    {selectedIssue && (
                        <div className="absolute bottom-10 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-1000">
                            <Card className="bg-background/95 backdrop-blur-md border-border shadow-xl rounded-xl">
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Badge
                                                variant="outline"
                                                className="text-[10px] mb-1"
                                            >
                                                {selectedIssue.category}
                                            </Badge>

                                            <h4 className="font-bold text-base text-foreground leading-snug">
                                                {selectedIssue.title}
                                            </h4>
                                        </div>

                                        {getStatusBadge(selectedIssue.status)}
                                    </div>

                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />

                                        <span>
                                            {selectedIssue.location}
                                        </span>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-border gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            Coordinates: {selectedIssue.lat},{" "}
                                            {selectedIssue.lng}
                                        </span>

                                        <Button
                                            size="sm"
                                            className="gap-1.5 text-xs h-8"
                                        >
                                            <span>View Full Details</span>

                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Button>
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