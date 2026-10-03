"use client";


import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CivicReport } from "@/types";
import Image from "next/image";

interface ReportDetailModalProps {
    report: CivicReport | null;
    onClose: () => void;
}

export default function ReportDetailModal({
    report,
    onClose,
}: ReportDetailModalProps) {
    if (!report) return null;

    return (
        <Dialog open={!!report} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[calc(100%-2rem)] max-w-4xl! p-5 sm:p-6 space-y-4 max-h-[94vh] overflow-y-auto rounded-2xl">                <DialogHeader className="space-y-2 text-left">
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-mono text-white font-bold">
                        {report.trackingId}
                    </Badge>
                    <span className="text-xs font-bold text-muted-foreground">
                        {report.category}
                    </span>
                </div>
                <DialogTitle className="text-lg sm:text-xl font-extrabold text-foreground">
                    {report.title}
                </DialogTitle>
            </DialogHeader>

                <div className="w-full h-56 sm:h-64 rounded-xl overflow-hidden bg-muted border border-border">
                     <Image
                    src={report.image}
                    alt={report.title}
                    fill
                    className="object-cover"
                />
                </div>

                <div className="space-y-2">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Report Description
                    </h4>
                    <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-muted/40 p-4 rounded-xl border border-border">
                        {report.description}
                    </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="bg-muted/40 p-3 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">
                            Location / Ward
                        </span>
                        <span className="font-bold text-foreground mt-0.5 block">
                            {report.ward}
                        </span>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">
                            Department
                        </span>
                        <span className="font-bold text-primary mt-0.5 block">
                            {report.department}
                        </span>
                    </div>
                    <div className="bg-muted/40 p-3 rounded-xl border border-border">
                        <span className="text-muted-foreground block text-[10px]">
                            Assigned Officer
                        </span>
                        <span className="font-bold text-foreground mt-0.5 block">
                            {report.assignedOfficer || "Unassigned"}
                        </span>
                    </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                        Last updated: {report.updatedAt}
                    </span>
                    <Button onClick={onClose} size="sm" className="rounded-md py-5 font-bold">
                        Close Overview
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}