"use client";

import React from "react";
import { MapPin, Calendar, ThumbsUp, MessageSquare, ChevronRight } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CivicReport } from "@/types";
import Image from "next/image";

interface ReportCardProps {
    report: CivicReport;
    isUpvoted: boolean;
    onUpvote: (id: string, e: React.MouseEvent) => void;
    onClick: () => void;
}

export default function ReportCard({
    report,
    isUpvoted,
    onUpvote,
    onClick,
}: ReportCardProps) {
    return (
        <Card
            onClick={onClick}
            className="border border-border rounded-2xl overflow-hidden shadow-sm hover:border-primary/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
            <div>
                <div className="relative -mt-4 h-48 w-full overflow-hidden bg-muted">
                    <Image
                        src={report.image}
                        alt={report.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />

                    <Badge
                        variant="outline"
                        className="absolute top-3 left-3 bg-background/90 backdrop-blur-md text-primary font-mono text-[11px] font-extrabold rounded-lg border-border"
                    >
                        {report.trackingId}
                    </Badge>

                    <span
                        className={`absolute top-3 right-3 text-[11px] font-extrabold px-2.5 py-1 rounded-lg backdrop-blur-md border ${report.status === "Resolved"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : report.status === "In Progress"
                                ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                : "bg-blue-500/20 text-blue-400 border-blue-500/40"
                            }`}
                    >
                        {report.status}
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium flex items-center gap-1.5 truncate">
                        <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{report.location}</span>
                    </div>
                </div>


                <CardContent className="p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                        <span className="text-primary font-bold">{report.category}</span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {report.date}
                        </span>
                    </div>

                    <h3 className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {report.title}
                    </h3>

                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {report.description}
                    </p>
                </CardContent>
            </div>


            <CardFooter className="px-4 sm:px-5 py-3.5 bg-muted/40 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                <Button
                    type="button"
                    variant={isUpvoted ? "default" : "outline"}
                    size="sm"
                    onClick={(e) => onUpvote(report.id, e)}
                    className="h-8 gap-1.5 rounded-xl text-xs"
                >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isUpvoted ? "fill-white" : ""}`} />
                    <span>{report.upvotes}</span>
                </Button>

                <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5" /> {report.commentsCount}
                    </span>
                    <span className="flex items-center gap-1 text-primary font-bold group-hover:underline">
                        View <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                </div>
            </CardFooter>
        </Card>
    );
}