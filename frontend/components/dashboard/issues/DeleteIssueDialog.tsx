"use client";

import { Loader2, Trash2 } from "lucide-react";

import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Report } from "@/types/report";
import Image from "next/image";

interface DeleteIssueDialogProps {
    issue: Report;
    open: boolean;
    isPending: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export default function DeleteIssueDialog({
    issue,
    open,
    isPending,
    onOpenChange,
    onConfirm,
}: DeleteIssueDialogProps) {
    const cover = issue.media?.find((item) => item.type === "image");
    const coverUrl = cover ? (cover.url ?? cover.storageKey) : null;

    return (
        <AlertDialog
            open={open}
            onOpenChange={(next) => {
                if (!isPending) onOpenChange(next);
            }}
        >
            <AlertDialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                <div className="flex flex-col items-center gap-3 bg-destructive/5 px-6 pb-5 pt-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 ring-8 ring-destructive/5">
                        <Trash2 className="h-6 w-6 text-destructive" />
                    </div>

                    <AlertDialogHeader className="items-center space-y-1.5 text-center sm:text-center">
                        <AlertDialogTitle className="text-lg font-extrabold">
                            Delete this report?
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm">
                            It will be removed from the public site. Comments
                            and history are kept.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                </div>

                <div className="px-6 py-5">
                    <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
                        {coverUrl ? (
                            <Image
                                src={coverUrl}
                                alt={issue.title}
                                width={100}
                                height={100}
                                className="h-14 w-14 shrink-0 rounded-lg object-cover"
                            />
                        ) : (
                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground">
                                No image
                            </div>
                        )}

                        <div className="min-w-0 space-y-1">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">
                                {issue.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs text-primary">
                                    {issue.trackingCode.slice(-4)}
                                </span>
                                {issue.category?.name && (
                                    <Badge variant="secondary" className="text-xs">
                                        {issue.category.name}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <AlertDialogFooter className="gap-2 border-t border-border bg-muted/30 my-1 mx-2 sm:flex-row sm:justify-end">
                    <AlertDialogCancel
                        disabled={isPending}
                        className="w-full sm:w-auto"
                    >
                        Cancel
                    </AlertDialogCancel>

                    <Button
                        type="button"
                        variant="destructive"
                        onClick={onConfirm}
                        disabled={isPending}
                        className="w-full bg-destructive text-white hover:bg-destructive/90 sm:w-auto"
                    >
                        {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        {isPending ? "Deleting..." : "Yes, delete"}
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}