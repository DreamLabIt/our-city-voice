"use client";

import { useState } from "react";
import Link from "next/link";
import {
    Calendar,
    ExternalLink,
    Eye,
    Film,
    Heart,
    MapPin,
    MessageSquare,
    User,
} from "lucide-react";

import IssueComments from "@/components/dashboard/issues/IssueComments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import type { Report, ReportMedia } from "@/types/report";
import Image from "next/image";

interface ViewIssueDialogProps {
    issue: Report;
    onClose: () => void;
}

type ViewTab = "details" | "comments";

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-tag-amber-bg text-tag-amber-text",
    in_progress: "bg-tag-blue-bg text-tag-blue-text",
    resolved: "bg-tag-green-bg text-tag-green-text",
    rejected: "bg-destructive/10 text-destructive",
};

const PRIORITY_STYLES: Record<string, string> = {
    low: "bg-muted text-foreground",
    medium: "bg-tag-blue-bg text-tag-blue-text",
    high: "bg-tag-amber-bg text-tag-amber-text",
    critical: "bg-destructive/10 text-destructive",
};

function formatDate(value?: string | null): string {
    if (!value) return "-";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
}

function mediaSrc(media: ReportMedia): string {
    return media.url ?? media.storageKey;
}

function InfoItem({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-0.5">
            <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                {label}
            </dt>
            <dd className="text-sm text-foreground">{children}</dd>
        </div>
    );
}

export default function ViewIssueDialog({
    issue,
    onClose,
}: ViewIssueDialogProps) {
    const mediaList = issue.media ?? [];
    const [activeIndex, setActiveIndex] = useState(0);
    const active = mediaList[activeIndex];

    const [tab, setTab] = useState<ViewTab>("details");
    const [commentsVisited, setCommentsVisited] = useState(false);

    const openTab = (next: ViewTab): void => {
        setTab(next);
        if (next === "comments") setCommentsVisited(true);
    };

    const addressLine = [issue.address, issue.street, issue.city, issue.postalCode]
        .filter(Boolean)
        .join(", ");

    const tabClass = (value: ViewTab): string =>
        `inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${tab === value
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`;

    return (
        <Dialog
            open
            onOpenChange={(open) => {
                if (!open) onClose();
            }}
        >
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl no-scrollbar">
                <DialogHeader className="space-y-2 text-left">


                    <DialogTitle className="text-lg font-extrabold leading-snug sm:text-xl">
                        {issue.title}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Details of report {issue.trackingCode}
                    </DialogDescription>
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="font-mono text-xs text-primary">
                            Code : {issue.trackingCode.slice(-6)}
                        </span>
                        <Badge
                            variant="secondary"
                            className={`capitalize ${STATUS_STYLES[issue.status] ?? "bg-muted text-foreground"}`}
                        >
                            {issue.status.replace("_", " ")}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={`capitalize ${PRIORITY_STYLES[issue.priority] ?? "bg-muted text-foreground"}`}
                        >
                            {issue.priority}
                        </Badge>
                    </div>
                </DialogHeader>

                <div
                    role="tablist"
                    className="flex gap-1 border-b border-border"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "details"}
                        onClick={() => openTab("details")}
                        className={tabClass("details")}
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tab === "comments"}
                        onClick={() => openTab("comments")}
                        className={tabClass("comments")}
                    >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Comments ({issue.commentCount ?? 0})
                    </button>
                </div>

                <div className={tab === "details" ? "space-y-5" : "hidden"}>
                    {mediaList.length > 0 && active && (
                        <div className="space-y-2">
                            <div className="overflow-hidden rounded-xl border border-border bg-black">
                                {active.type === "video" ? (
                                    <video
                                        key={active.id}
                                        src={mediaSrc(active)}
                                        controls
                                        playsInline
                                        className="h-64 sm:h-80 w-full object-cover cursor-pointer"
                                    />
                                ) : (
                                    <Image
                                        src={mediaSrc(active)}
                                        alt={issue.title}
                                        width={100}
                                        height={100}
                                        className="h-70 w-full sm:h-80 object-cover"
                                        priority
                                        sizes="(max-width: 1024px) 100vw, 66vw"
                                    />
                                )}
                            </div>

                            {mediaList.length > 1 && (
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {mediaList.map((media, index) => (
                                        <button
                                            key={media.id}
                                            type="button"
                                            onClick={() => setActiveIndex(index)}
                                            aria-label={`Show attachment ${index + 1}`}
                                            className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 bg-muted transition-colors ${index === activeIndex
                                                ? "border-primary"
                                                : "border-transparent opacity-70 hover:opacity-100"
                                                }`}
                                        >
                                            {media.type === "video" ? (
                                                <>
                                                    {media.thumbnailUrl ? (
                                                        <Image
                                                            src={media.thumbnailUrl}
                                                            width={100}
                                                            height={100}
                                                            alt=""
                                                            className="h-full w-full"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full bg-black" />
                                                    )}
                                                    <Film className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow" />
                                                </>
                                            ) : (
                                                <Image
                                                    src={mediaSrc(media)}
                                                    width={100}
                                                    height={100}
                                                    alt=""
                                                    className="h-full w-full "
                                                />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="space-y-1">
                        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                            Description
                        </h4>
                        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                            {issue.description}
                        </p>
                    </div>

                    <dl className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2">
                        <InfoItem label="Category">
                            {issue.category?.name ?? "-"}
                        </InfoItem>
                        <InfoItem label="Ward">{issue.ward?.name ?? "-"}</InfoItem>
                        <InfoItem label="Department">
                            {issue.department?.name ?? "-"}
                        </InfoItem>
                        <InfoItem label="Assigned officer">
                            {issue.assignedOfficer?.name ?? "Unassigned"}
                        </InfoItem>
                        <InfoItem label="Reporter">
                            <span className="inline-flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {issue.isAnonymous
                                    ? "Anonymous"
                                    : (issue.author?.name ?? "-")}
                            </span>
                        </InfoItem>
                        <InfoItem label="Reported on">
                            <span className="inline-flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatDate(issue.createdAt)}
                            </span>
                        </InfoItem>
                        <InfoItem label="Last updated">
                            {formatDate(issue.updatedAt)}
                        </InfoItem>
                        {issue.resolvedAt && (
                            <InfoItem label="Resolved on">
                                {formatDate(issue.resolvedAt)}
                            </InfoItem>
                        )}
                        <div className="sm:col-span-2">
                            <InfoItem label="Location">
                                <span className="inline-flex items-start gap-1.5">
                                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                    {addressLine || "-"}
                                </span>
                            </InfoItem>
                        </div>
                    </dl>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                            <Heart className="h-3.5 w-3.5" />
                            {issue.likeCount} likes
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {issue.commentCount} comments
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5" />
                            {issue.viewCount} views
                        </span>
                    </div>
                </div>

                <div className={tab === "comments" ? "block" : "hidden"}>
                    {commentsVisited && (
                        <IssueComments
                            issueCode={issue.trackingCode}
                            issueId={issue.id}
                        />
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between border-t-border">
                    <Button type="button" variant="outline" onClick={onClose}>
                        Close
                    </Button>
                    <Button >
                        <Link
                            href={`/issues/${issue.trackingCode}`}
                            className="flex gap-2 p-2"
                        >
                            <span>View Full Details</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}