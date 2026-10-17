"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, ChevronDown } from "lucide-react";
import { updateReportStatus } from "@/app/actions/issues";
import { StatusBadgeSelectProps } from "@/types/issues";

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-tag-amber-bg text-tag-amber-text border-amber-300/40",
    in_progress: "bg-tag-blue-bg text-tag-blue-text border-blue-300/40",
    resolved: "bg-tag-green-bg text-tag-green-text border-emerald-300/40",
    rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUSES: { value: "pending" | "in_progress" | "resolved" | "rejected"; label: string }[] = [
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "resolved", label: "Resolved" },
    { value: "rejected", label: "Rejected" },
];

export default function StatusBadgeSelect({
    trackingCode,
    currentStatus,
    isAdmin = false,
}: StatusBadgeSelectProps) {
    const [status, setStatus] = useState<string>(currentStatus);
    const [selectedNewStatus, setSelectedNewStatus] = useState<
        "pending" | "in_progress" | "resolved" | "rejected" | null
    >(null);
    const [note, setNote] = useState<string>("");
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [isPending, startTransition] = useTransition();

    const handleSelectStatus = (newStatus: "pending" | "in_progress" | "resolved" | "rejected") => {
        if (newStatus === status) return;
        setSelectedNewStatus(newStatus);
        setNote("");
        setIsModalOpen(true);
    };

    const handleConfirmStatusChange = () => {
        if (!selectedNewStatus) return;

        startTransition(async () => {
            const res = await updateReportStatus(trackingCode, selectedNewStatus, note);
            if (res.success) {
                setStatus(selectedNewStatus);
                setIsModalOpen(false);
            } else {
                alert(res.error || "Failed to update status.");
            }
        });
    };

    if (!isAdmin) {
        return (
            <Badge
                variant="secondary"
                className={`capitalize ${STATUS_STYLES[status] ?? "bg-muted text-foreground"}`}
            >
                {status.replace("_", " ")}
            </Badge>
        );
    }

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger disabled={isPending}>
                    <Badge
                        variant="secondary"
                        className={`capitalize cursor-pointer flex items-center gap-1.5 px-2.5 py-1 transition-all hover:opacity-80 outline-none focus:ring-1 focus:ring-primary ${STATUS_STYLES[status] ?? "bg-muted text-foreground"
                            }`}
                    >
                        {isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                            <>
                                <span>{status.replace("_", " ")}</span>
                                <ChevronDown className="w-3 h-3 opacity-70" />
                            </>
                        )}
                    </Badge>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="start" className="w-40">
                    {STATUSES.map((item) => (
                        <DropdownMenuItem
                            key={item.value}
                            onClick={() => handleSelectStatus(item.value)}
                            className={`capitalize cursor-pointer ${item.value === status ? "font-bold bg-muted" : ""
                                }`}
                        >
                            {item.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base font-bold">
                            Update Status to &quot;{selectedNewStatus?.replace("_", " ")}&quot;
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <p className="text-xs text-muted-foreground">
                            Optionally attach a note describing the progress or resolution details for this report.
                        </p>
                        <Textarea
                            placeholder="Add an optional note (e.g., Resealed road surface)..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            maxLength={1000}
                            className="text-xs resize-none"
                            rows={3}
                        />
                    </div>

                    <DialogFooter className="flex justify-end gap-2 border-t-border">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsModalOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleConfirmStatusChange}
                            disabled={isPending}
                        >
                            {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
                            Update Status
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}