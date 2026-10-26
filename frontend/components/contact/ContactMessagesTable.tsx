"use client";

import { useState, useSyncExternalStore } from "react";
import {
    Mail,
    Phone,
    Calendar,
    Eye,
    MessageSquare,
    User,
    Tag,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import type { ContactMessage, ContactMessagesTableProps } from "@/types/contact";

function formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });
}

const subscribeToMount = () => () => {};
const getMountedSnapshot = () => true;
const getServerMountedSnapshot = () => false;

export default function ContactMessagesTable({
    messages,
    total,
    currentPage,
    totalPages,
    basePath,
}: ContactMessagesTableProps) {
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const isMounted = useSyncExternalStore(
        subscribeToMount,
        getMountedSnapshot,
        getServerMountedSnapshot,
    );

    const pageUrl = (page: number): string => {
        return `${basePath}?page=${page}`;
    };

    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
        const end = Math.min(totalPages, start + maxVisible - 1);

        if (end - start + 1 < maxVisible) {
            start = Math.max(1, end - maxVisible + 1);
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        return pages;
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-extrabold text-foreground sm:text-2xl">
                        Contact Messages
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Total <span className="font-semibold text-primary">{total}</span>{" "}
                        {total === 1 ? "Message" : "Messages"} received
                    </p>
                </div>
            </div>

            <div className="hidden rounded-xl border border-border bg-card md:block overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-border bg-muted">
                            <TableHead className="pl-4">Sender</TableHead>
                            <TableHead className="pl-4">Category</TableHead>
                            <TableHead className="pl-1">Subject</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Received Date</TableHead>
                            <TableHead className="pr-7 text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {messages.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="py-12 text-center text-muted-foreground"
                                >
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <MessageSquare className="h-8 w-8 opacity-40" />
                                        <span>No contact messages found.</span>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            messages.map((msg) => (
                                <TableRow key={msg.id} className="hover:bg-muted/30">
                                    <TableCell className="border-t border-border pl-4">
                                        <div className="font-medium text-foreground">{msg.name}</div>
                                        <div className="text-xs text-muted-foreground">{msg.email}</div>
                                    </TableCell>

                                    <TableCell className="border-t border-border">
                                        <Badge variant="secondary" className="bg-tag-blue-bg text-tag-blue-text">
                                            {msg.category?.name ?? "General"}
                                        </Badge>
                                    </TableCell>

                                    <TableCell className="max-w-xs truncate border-t border-border font-medium text-foreground">
                                        {msg.subject}
                                    </TableCell>

                                    <TableCell className="border-t border-border text-xs text-muted-foreground">
                                        {msg.phone || "-"}
                                    </TableCell>

                                    <TableCell className="whitespace-nowrap border-t border-border text-xs text-muted-foreground">
                                        {isMounted ? formatDate(msg.createdAt) : null}
                                    </TableCell>

                                    <TableCell className="border-t border-border pr-5 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedMessage(msg)}
                                            className="h-8 px-2.5 text-xs gap-1.5 hover:text-primary cursor-pointer"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>View</span>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="space-y-3 md:hidden">
                {messages.length === 0 ? (
                    <Card>
                        <CardContent className="py-10 text-center text-sm text-muted-foreground">
                            No contact messages found.
                        </CardContent>
                    </Card>
                ) : (
                    messages.map((msg) => (
                        <Card key={msg.id} className="border-border">
                            <CardContent className="space-y-3 p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h3 className="font-bold text-foreground text-sm">{msg.name}</h3>
                                        <p className="text-xs text-muted-foreground">{msg.email}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-tag-blue-bg text-tag-blue-text text-[10px]">
                                        {msg.category?.name ?? "General"}
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-xs font-semibold text-foreground">Subject:</p>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{msg.subject}</p>
                                </div>

                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                                    <span>{isMounted ? formatDate(msg.createdAt) : null}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedMessage(msg)}
                                        className="h-7 text-xs gap-1"
                                    >
                                        <Eye className="h-3 w-3" />
                                        <span>Details</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {totalPages > 1 && (
                <div className="pt-2">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href={pageUrl(Math.max(1, currentPage - 1))}
                                    aria-disabled={currentPage <= 1}
                                    className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>

                            {getPageNumbers().map((page) => (
                                <PaginationItem key={page}>
                                    <PaginationLink
                                        href={pageUrl(page)}
                                        isActive={page === currentPage}
                                    >
                                        {page}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}

                            <PaginationItem>
                                <PaginationNext
                                    href={pageUrl(Math.min(totalPages, currentPage + 1))}
                                    aria-disabled={currentPage >= totalPages}
                                    className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}

            <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
                {selectedMessage && (
                    <DialogContent className="sm:max-w-xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-extrabold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-primary" />
                                Message Details
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 pt-2 text-sm">
                            <div className="grid grid-cols-2 gap-3 bg-muted/40 p-3 rounded-lg text-xs">
                                <div className="space-y-1">
                                    <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                                        <User className="h-3.5 w-3.5" /> Sender Name
                                    </span>
                                    <p className="font-medium text-foreground">{selectedMessage.name}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                                        <Mail className="h-3.5 w-3.5" /> Email
                                    </span>
                                    <p className="font-medium text-foreground break-all">{selectedMessage.email}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                                        <Phone className="h-3.5 w-3.5" /> Phone
                                    </span>
                                    <p className="font-medium text-foreground">{selectedMessage.phone || "N/A"}</p>
                                </div>

                                <div className="space-y-1">
                                    <span className="flex items-center gap-1 text-muted-foreground font-semibold">
                                        <Tag className="h-3.5 w-3.5" /> Category
                                    </span>
                                    <p className="font-medium text-foreground">{selectedMessage.category?.name ?? "General"}</p>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" /> Sent On
                                </span>
                                <p className="text-xs text-foreground">
                                    {isMounted ? formatDate(selectedMessage.createdAt) : null}
                                </p>
                            </div>

                            <div className="space-y-1">
                                <span className="text-xs font-semibold text-muted-foreground">Subject</span>
                                <p className="font-bold text-foreground">{selectedMessage.subject}</p>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-border">
                                <span className="text-xs font-semibold text-muted-foreground">Message Body</span>
                                <div className="p-3.5 rounded-lg bg-section border border-border text-foreground text-xs leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}