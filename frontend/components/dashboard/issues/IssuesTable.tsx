import ReportFilters from "@/components/issues/reports/ReportFilters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { Report } from "@/types/report";
import type { IssuesFilters, IssuesEditOptions } from "@/types/issues";
import IssueRowActions from "./IssueRowActions";
import { MessageSquare } from "lucide-react";

interface IssuesTableProps {
    issues: Report[];
    total: number;
    currentPage: number;
    totalPages: number;
    isAdmin: boolean;
    basePath: string;
    baseQuery: string;
    filters: IssuesFilters;
    editOptions: IssuesEditOptions;
}

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

function formatDate(value: string): string {
    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? "-"
        : date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
}

function shortCode(code: string): string {
    return code.slice(-6);
}

function getPageNumbers(
    currentPage: number,
    totalPages: number,
): (number | "ellipsis")[] {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    pages.push(totalPages);

    return pages;
}

function StatusBadge({ status }: { status: string }) {
    return (
        <Badge
            variant="secondary"
            className={`capitalize ${STATUS_STYLES[status] ?? "bg-muted text-foreground"}`}
        >
            {status.replace("_", " ")}
        </Badge>
    );
}

function PriorityBadge({ priority }: { priority: string }) {
    return (
        <Badge
            variant="secondary"
            className={`capitalize ${PRIORITY_STYLES[priority] ?? "bg-muted text-foreground"}`}
        >
            {priority}
        </Badge>
    );
}


export default function IssuesTable({
    issues,
    total,
    currentPage,
    totalPages,
    isAdmin,
    basePath,
    baseQuery,
    filters,
    editOptions,
}: IssuesTableProps) {
    const pageUrl = (page: number): string => {
        const query = new URLSearchParams(baseQuery);
        query.set("page", String(page));
        return `${basePath}?${query.toString()}`;
    };

    const columnCount = isAdmin ? 10 : 9;

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">
                        {isAdmin ? "All Issues" : "My Issues"}
                    </h1>
                    <p className="text-md text-muted-foreground">
                        Total <span className="text-primary px-1">{total}</span>{" "}
                        {total === 1 ? "Issue" : "Issues"}
                    </p>
                </div>
            </div>

            <ReportFilters
                searchQuery={filters.searchQuery}
                selectedCategory={filters.selectedCategory}
                selectedStatus={filters.selectedStatus}
                selectedWard={filters.selectedWard}
                categories={filters.categories}
                statuses={filters.statuses}
                wards={filters.wards}
                enableSearchSuggestions
            />

            <div className="hidden rounded-xl border border-border bg-card md:block">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border">
                            <TableHead className="pl-4">Code</TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Ward</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            {isAdmin && <TableHead>Reporter</TableHead>}
                            <TableHead>Date</TableHead>
                            <TableHead className="text-center">Comments</TableHead>
                            <TableHead className="pr-5 text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {issues.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columnCount}
                                    className="py-10 text-center text-muted-foreground"
                                >
                                    No issues found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            issues.map((issue) => (
                                <TableRow key={issue.id}>
                                    <TableCell
                                        className="border-t border-border pl-4 font-mono text-xs text-primary"
                                        title={issue.trackingCode}
                                    >
                                        {shortCode(issue.trackingCode)}
                                    </TableCell>
                                    <TableCell className="max-w-60 truncate border-t border-border font-medium">
                                        {issue.title}
                                    </TableCell>
                                    <TableCell className="border-t border-border">
                                        {issue.category?.name ?? "-"}
                                    </TableCell>
                                    <TableCell className="max-w-40 truncate border-t border-border">
                                        {issue.ward?.name ?? "-"}
                                    </TableCell>
                                    <TableCell className="border-t border-border">
                                        <PriorityBadge priority={issue.priority} />
                                    </TableCell>
                                    <TableCell className="border-t border-border">
                                        <StatusBadge status={issue.status} />
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell className="border-t border-border">
                                            {issue.isAnonymous
                                                ? "Anonymous"
                                                : (issue.author?.name ?? "-")}
                                        </TableCell>
                                    )}
                                    <TableCell className="whitespace-nowrap border-t border-border">
                                        {formatDate(issue.createdAt)}
                                    </TableCell>
                                    <TableCell className="border-t border-border text-center">
                                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                            <MessageSquare className="h-3.5 w-3.5" />
                                            {issue.commentCount ?? 0}
                                        </span>
                                    </TableCell>
                                    <TableCell className="border-t border-border">
                                        <IssueRowActions
                                            issue={issue}
                                            categories={editOptions.categories}
                                            wards={editOptions.wards}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="space-y-3 md:hidden">
                {issues.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No issues found.
                        </CardContent>
                    </Card>
                ) : (
                    issues.map((issue) => (
                        <Card key={issue.id}>
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p
                                            className="font-mono text-xs text-primary"
                                            title={issue.trackingCode}
                                        >
                                            Code : {shortCode(issue.trackingCode)}
                                        </p>
                                        <h3 className="line-clamp-2 pt-2 text-sm font-semibold text-foreground">
                                            {issue.title}
                                        </h3>
                                    </div>
                                    <IssueRowActions
                                        issue={issue}
                                        categories={editOptions.categories}
                                        wards={editOptions.wards}
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    <StatusBadge status={issue.status} />
                                    <PriorityBadge priority={issue.priority} />
                                </div>

                                <dl className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                    <div>
                                        <dt className="font-semibold">Category</dt>
                                        <dd>{issue.category?.name ?? "-"}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold">Ward</dt>
                                        <dd className="truncate">
                                            {issue.ward?.name ?? "-"}
                                        </dd>
                                    </div>
                                    {isAdmin && (
                                        <div>
                                            <dt className="font-semibold">
                                                Reporter
                                            </dt>
                                            <dd>
                                                {issue.isAnonymous
                                                    ? "Anonymous"
                                                    : (issue.author?.name ?? "-")}
                                            </dd>
                                        </div>
                                    )}

                                    <div>
                                        <dt className="font-semibold">Date</dt>
                                        <dd>{formatDate(issue.createdAt)}</dd>
                                    </div>
                                    <div>
                                        <dt className="font-semibold">Comments</dt>
                                        <dd>{issue.commentCount ?? 0}</dd>
                                    </div>

                                </dl>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious
                                href={pageUrl(Math.max(1, currentPage - 1))}
                                aria-disabled={currentPage <= 1}
                                className={
                                    currentPage <= 1
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                }
                            />
                        </PaginationItem>

                        {getPageNumbers(currentPage, totalPages).map(
                            (page, index) => (
                                <PaginationItem key={`${page}-${index}`}>
                                    {page === "ellipsis" ? (
                                        <PaginationEllipsis />
                                    ) : (
                                        <PaginationLink
                                            href={pageUrl(page)}
                                            isActive={currentPage === page}
                                        >
                                            {page}
                                        </PaginationLink>
                                    )}
                                </PaginationItem>
                            ),
                        )}

                        <PaginationItem>
                            <PaginationNext
                                href={pageUrl(
                                    Math.min(totalPages, currentPage + 1),
                                )}
                                aria-disabled={currentPage >= totalPages}
                                className={
                                    currentPage >= totalPages
                                        ? "pointer-events-none opacity-50"
                                        : ""
                                }
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            )}
        </div>
    );
}