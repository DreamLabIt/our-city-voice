"use client";

import { useCallback, useEffect, useState } from "react";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import { getReportComments } from "@/app/actions/report";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { postComments as mockComments } from "@/data/mock-data";
import type { ReportCommentThread } from "@/types/report";
import Image from "next/image";

const LIMIT = 20;

interface IssueCommentsProps {
    issueCode: string;
    issueId: string;
}

function initials(name?: string | null): string {
    if (!name) return "?";

    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

function fullDate(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
}

function timeAgo(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    const diffSeconds = Math.round((date.getTime() - Date.now()) / 1000);
    if (diffSeconds > 0) return fullDate(value);

    const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
        ["year", 31_536_000],
        ["month", 2_592_000],
        ["week", 604_800],
        ["day", 86_400],
        ["hour", 3_600],
        ["minute", 60],
    ];

    const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

    for (const [unit, seconds] of units) {
        if (Math.abs(diffSeconds) >= seconds) {
            return formatter.format(Math.round(diffSeconds / seconds), unit);
        }
    }

    return "just now";
}

function CommentItem({
    comment,
    isReply = false,
}: {
    comment: ReportCommentThread;
    isReply?: boolean;
}) {
    const name = comment.author?.name ?? "Unknown user";
    const isOfficial = Boolean(comment.author?.departmentId);

    return (
        <div className="flex gap-3">
            {comment.author?.avatarUrl ? (
                <Image
                    src={comment.author.avatarUrl}
                    alt={name}
                    width={100}
                    height={100}
                    className={`shrink-0 rounded-full object-cover ${isReply ? "h-7 w-7" : "h-9 w-9"}`}
                />
            ) : (
                <div
                    className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${isReply ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs"}`}
                >
                    {initials(name)}
                </div>
            )}

            <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-sm font-semibold text-foreground">
                        {name}
                    </span>
                    {isOfficial && (
                        <Badge
                            variant="secondary"
                            className="bg-tag-blue-bg text-xs text-tag-blue-text"
                        >
                            Official
                        </Badge>
                    )}
                    <span
                        className="text-xs text-muted-foreground"
                        title={fullDate(comment.createdAt)}
                    >
                        {timeAgo(comment.createdAt)}
                    </span>
                </div>

                <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
                    {comment.message}
                </p>

                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3" />
                    {comment.likeCount}
                </span>

                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 border-l-2 border-border pl-4">
                        {comment.replies.map((reply) => (
                            <CommentItem key={reply.id} comment={reply} isReply />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default function IssueComments({
    issueCode,
    issueId,
}: IssueCommentsProps) {
    const [comments, setComments] = useState<ReportCommentThread[]>([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [usingMock, setUsingMock] = useState(false);

    const loadPage = useCallback(
        async (pageNumber: number): Promise<void> => {
            try {
                const res = await getReportComments(issueCode, {
                    page: pageNumber,
                    limit: LIMIT,
                });

                const fetched = res.comments ?? [];

                setComments((prev) =>
                    pageNumber === 1 ? fetched : [...prev, ...fetched],
                );
                setHasMore(fetched.length >= LIMIT);
                setPage(pageNumber);
                setUsingMock(false);
            } catch {
                if (pageNumber === 1) {
                    setComments(
                        mockComments.filter(
                            (comment) => comment.postId === issueId,
                        ),
                    );
                    setHasMore(false);
                    setUsingMock(true);
                }
            }
        },
        [issueCode, issueId],
    );

    useEffect(() => {
        let cancelled = false;

        loadPage(1).finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => {
            cancelled = true;
        };
    }, [loadPage]);

    const handleLoadMore = async (): Promise<void> => {
        setLoadingMore(true);
        await loadPage(page + 1);
        setLoadingMore(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (comments.length === 0) {
        return (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <MessageSquare className="h-8 w-8" />
                <p className="text-sm">No comments yet.</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {usingMock && (
                <p className="text-xs text-muted-foreground">
                    Showing sample comments (server unavailable).
                </p>
            )}

            {comments.map((comment) => (
                <CommentItem key={comment.id} comment={comment} />
            ))}

            {hasMore && (
                <div className="flex justify-center pt-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                    >
                        {loadingMore && (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        )}
                        Load more
                    </Button>
                </div>
            )}
        </div>
    );
}