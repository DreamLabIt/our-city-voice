import React from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import type { StatsWardTableProps } from "@/types/statistics";

export default function StatsWardTable({ stats }: StatsWardTableProps) {
    return (
        <Card className="bg-card border border-border-custom rounded-2xl shadow-xs overflow-hidden">
            <CardHeader className="p-5 sm:p-6 pb-4 space-y-1 border-b border-border-custom/60">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                    By Ward
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                    Report status breakdown across different wards and regions.
                </CardDescription>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border-custom bg-muted/40 hover:bg-muted/40">
                                <TableHead className="text-left font-semibold text-xs uppercase tracking-wider py-3.5 px-6 text-muted-foreground">
                                    Ward
                                </TableHead>
                                <TableHead className="text-left font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-muted-foreground">
                                    Total
                                </TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-muted-foreground">
                                    Pending
                                </TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-3.5 px-4 text-muted-foreground">
                                    In Progress
                                </TableHead>
                                <TableHead className="text-right font-semibold text-xs uppercase tracking-wider py-3.5 px-6 text-muted-foreground">
                                    Resolved
                                </TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-border-custom/60">
                            {stats.byWard.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-8 text-center text-sm text-muted-foreground"
                                    >
                                        No ward statistics available.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stats.byWard.map((row) => (
                                    <TableRow
                                        key={row.ward}
                                        className="transition-colors hover:bg-muted/30"
                                    >
                                        <TableCell className="py-3.5 px-6 text-foreground font-medium text-left">
                                            {row.ward}
                                        </TableCell>

                                        <TableCell className="py-3.5 px-4 text-left tabular-nums text-foreground font-bold">
                                            {row.total}
                                        </TableCell>

                                        <TableCell className="py-3.5 px-4 text-right tabular-nums text-muted-foreground">
                                            {row.pending || "—"}
                                        </TableCell>

                                        <TableCell className="py-3.5 px-4 text-right tabular-nums text-muted-foreground">
                                            {row.inProgress || "—"}
                                        </TableCell>

                                        <TableCell className="py-3.5 px-6 text-right tabular-nums text-muted-foreground">
                                            {row.resolved || "—"}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}