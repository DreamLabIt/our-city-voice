"use client";

import { useState } from "react";
import {
    Loader2,
    FileText,
    CheckCircle2,
    Clock,
    Users,
    ShieldAlert,
    MessageSquare,
    TrendingUp,
    ThumbsUp,
    Layers,
    MapPin,
    AlertTriangle
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CategoryItem, CategoryItemTable, OverviewProps, WardItem } from "@/types";

export default function Overview({
    user,
    isAdmin = false,
    adminOverview,
    myStats,
}: OverviewProps) {
    const [loading] = useState<boolean>(false);
    const role = user?.role;
    const isSuperAdmin = isAdmin || role === "super_admin";
    const stats = isSuperAdmin ? adminOverview?.stats : myStats;
    const activity = adminOverview?.activity;
    const moderation = adminOverview?.moderation;
    const usersInfo = adminOverview?.users;
    const contactMsg = adminOverview?.contactMessages;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-75">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="p-8 text-center text-muted-foreground bg-card border border-border-custom rounded-xl">
                No overview statistics available at the moment.
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                        {isSuperAdmin ? "System Admin Overview" : "Citizen Dashboard Overview"}
                    </h1>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                        {isSuperAdmin
                            ? "Comprehensive management metrics, platform health, and citywide analytics."
                            : `Welcome back, ${user?.name || "Citizen"}! Here is the summary of your civic contributions.`}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card border-border-custom border-l-4 border-l-primary rounded-xl shadow-xs">
                    <CardContent className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-semibold">
                            <span>{isSuperAdmin ? "Total Platform Reports" : "My Filed Reports"}</span>
                            <FileText className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex items-baseline gap-2 justify-center">
                            <span className="text-4xl font-extrabold text-foreground">{stats.total}</span>
                            <span className="text-xs text-muted-foreground">cases</span>
                        </div>
                        <p className="text-lg text-muted-foreground text-center">
                            Resolved: <strong className="text-foreground">{stats.resolved}</strong> ({stats.resolutionRate}%)
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border-custom border-l-4 border-l-orange-500 rounded-xl shadow-xs">
                    <CardContent className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-semibold">
                            <span>Active / Open Issues</span>
                            <Clock className="w-8 h-8 text-orange-500" />
                        </div>
                        <div className="flex items-baseline gap-2 justify-center">
                            <span className="text-4xl font-extrabold text-foreground">{stats.open}</span>
                            <span className="text-xs text-muted-foreground">pending triage</span>
                        </div>
                        <p className="text-lg text-muted-foreground text-center">
                            In Progress: <strong className="text-foreground">{stats.byStatus?.find((s: any) => s.status === 'in_progress')?.count || 0}</strong>
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border-custom border-l-4 border-l-purple-500 rounded-xl shadow-xs">
                    <CardContent className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-semibold">
                            <span>Engagement & Reach</span>
                            <ThumbsUp className="w-8 h-8 text-purple-500" />
                        </div>
                        <div className="flex items-baseline gap-2 justify-center">
                            <span className="text-3xl font-extrabold text-foreground">{stats.upvotes}</span>
                            <span className="text-xs text-muted-foreground">upvotes</span>
                        </div>
                        <p className="text-lg text-muted-foreground text-center">
                            Comments: <strong className="text-foreground">{stats.comments}</strong> | Views: <strong className="text-foreground">{stats.views}</strong>
                        </p>
                    </CardContent>
                </Card>

                {isSuperAdmin ? (
                    <Card className="bg-card border-border-custom border-l-4 border-l-destructive rounded-xl shadow-xs">
                        <CardContent className="p-5 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-semibold">
                                <span>Platform Health / Inbox</span>
                                <ShieldAlert className="w-8 h-8 text-destructive" />
                            </div>
                            <div className="flex items-baseline gap-2 justify-center">
                                <span className="text-4xl font-extrabold text-destructive">{moderation?.deleted || 0}</span>
                                <span className="text-xs text-muted-foreground">deleted reports</span>
                            </div>
                            <p className="text-lg text-muted-foreground text-center">
                                Unhandled Messages: <strong className="text-foreground">{contactMsg?.unhandled || 0}</strong>
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="bg-card border-border-custom border-l-4 border-l-emerald-500 rounded-xl shadow-xs">
                        <CardContent className="p-5 space-y-2">
                            <div className="flex items-center justify-between text-muted-foreground text-xs uppercase font-semibold">
                                <span>Resolution Rate</span>
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div className="flex items-baseline gap-2 justify-center">
                                <span className="text-4xl font-extrabold text-foreground">{stats.resolutionRate}%</span>
                                <span className="text-xs text-muted-foreground">success</span>
                            </div>
                            <p className="text-lg text-muted-foreground text-center">
                                Sample Size: <strong className="text-foreground">{stats.resolutionSampleSize}</strong> resolved
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {isSuperAdmin && usersInfo && activity && contactMsg && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-section border-border-custom rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-primary/10 text-primary rounded-xl">
                            <Users className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold text-center">Total Registered Users</p>
                            <p className="text-3xl font-bold text-foreground">{usersInfo.total} <span className="text-xs font-normal text-muted-foreground">(+{usersInfo.newThisMonth} this month)</span></p>
                        </div>
                    </Card>

                    <Card className="bg-section border-border-custom rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                            <MessageSquare className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold text-center">Contact Inbox Total</p>
                            <p className="text-3xl font-bold text-foreground">{contactMsg.total} <span className="text-xs font-normal text-muted-foreground">({contactMsg.unhandled} unhandled)</span></p>
                        </div>
                    </Card>

                    <Card className="bg-section border-border-custom rounded-xl p-4 flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
                            <TrendingUp className="w-8 h-8" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold text-center">Monthly Growth</p>
                            <p className="text-3xl font-bold text-foreground">+{activity.reportsChangePercent}% <span className="text-xs font-normal text-muted-foreground">vs last month</span></p>
                        </div>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border-custom rounded-2xl shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" /> Reports by Status
                        </CardTitle>
                        <CardDescription className="text-xs">Distribution of issues across different workflow stages.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.byStatus?.map((item: any) => {
                            const percent = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                            return (
                                <div key={item.status} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="capitalize text-foreground font-semibold">{item.status.replace("_", " ")}</span>
                                        <span className="text-muted-foreground">{item.count} ({percent.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-section rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-500"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>

                <Card className="bg-card border-border-custom rounded-2xl shadow-xs">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500" /> Reports by Priority
                        </CardTitle>
                        <CardDescription className="text-xs">Severity levels assigned during triage.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {stats.byPriority?.map((item: any) => {
                            const percent = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
                            return (
                                <div key={item.label} className="space-y-1">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="text-foreground font-semibold">{item.label}</span>
                                        <span className="text-muted-foreground">{item.count} ({percent.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2 w-full bg-section rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${item.label === 'Critical' ? 'bg-destructive' :
                                                item.label === 'High' ? 'bg-orange-500' :
                                                    item.label === 'Medium' ? 'bg-amber-500' : 'bg-primary'
                                                }`}
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-card border-border-custom rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-border-custom/60 pb-3">
                        <CardTitle className="text-base font-bold">Top Categories</CardTitle>
                        <CardDescription className="text-xs">What civic sectors are receiving the most reports.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 border-b-border">
                                    <TableHead className="text-xs uppercase font-semibold py-2.5 px-4">Category</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold py-2.5 px-4 text-right">Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border-custom/60">
                                {stats.byCategory && stats.byCategory.length > 0 ? (
                                    stats.byCategory.map((cat: CategoryItemTable) => (
                                        <TableRow key={cat.label} className="hover:bg-muted/30">
                                            <TableCell className="text-xs font-medium text-foreground py-2.5 px-4">{cat.label}</TableCell>
                                            <TableCell className="text-xs text-right font-bold text-foreground py-2.5 px-4">{cat.count}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center py-6 text-xs text-muted-foreground">
                                            No data found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border-custom rounded-2xl shadow-xs overflow-hidden">
                    <CardHeader className="border-b border-border-custom/60 pb-3">
                        <CardTitle className="text-base font-bold flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary" /> Ward Distribution
                        </CardTitle>
                        <CardDescription className="text-xs">Geographical breakdown of reported issues.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-muted/40 border-b-border">
                                    <TableHead className="text-xs uppercase font-semibold py-2.5 px-4">Ward Name</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold py-2.5 px-4 text-right">Total</TableHead>
                                    <TableHead className="text-xs uppercase font-semibold py-2.5 px-4 text-right">Pending</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border-custom/60">
                                {stats.byWard && stats.byWard.length > 0 ? (
                                    stats.byWard.map((ward: WardItem) => (
                                        <TableRow key={ward.ward} className="hover:bg-muted/30">
                                            <TableCell className="text-xs font-medium text-foreground py-2.5 px-4 truncate max-w-xs">{ward.ward}</TableCell>
                                            <TableCell className="text-xs text-right font-bold text-foreground py-2.5 px-4">{ward.total}</TableCell>
                                            <TableCell className="text-xs text-right text-muted-foreground py-2.5 px-4">{ward.pending}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center py-6 text-xs text-muted-foreground">
                                            No data found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}