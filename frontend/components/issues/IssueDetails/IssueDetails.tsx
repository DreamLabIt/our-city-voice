import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
    AlertTriangle,
    ArrowLeft,
    Building2,
    CheckCircle2,
    ChevronRight,
    Hash,
    Home,
    MapPin,
    Navigation,
    Plus,
    Tag,
    User,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type {
    IssueDetailsProps
} from "@/types/IssueDetails";

import {
    PRIORITY_LABEL,
    PRIORITY_STYLES,
    SIDE_CARD_CLASS,
    STATUS_LABEL,
    STATUS_STYLES,
} from "@/lib/utils";

import Post from "./Post";
import Comments from "./Comments";
import RelatedPosts from "./RelatedPosts";

function SummaryRow({
    icon: Icon,
    label,
    children,
}: {
    icon: LucideIcon;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border-custom bg-card px-3.5 py-2.5">
            <span className="flex items-center gap-1.5 font-semibold text-muted-foreground">
                <Icon className="h-3.5 w-3.5 text-primary" />
                {label}
            </span>

            {children}
        </div>
    );
}

export default function IssueDetails({
    post,
    comments,
    relatedPosts,
}: IssueDetailsProps): React.ReactNode {
    return (
        <section className="min-h-screen w-full bg-background text-foreground">
            <div className="w-full border-b border-border-custom bg-section">
                <div className="mx-auto flex max-w-458 flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-8 md:px-10">
                    <nav aria-label="Breadcrumb">
                        <ol className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground sm:text-sm">
                            <li>
                                <Link
                                    href="/"
                                    className="flex items-center gap-1 transition-colors hover:text-primary"
                                >
                                    <Home className="h-4 w-4" />
                                    Home
                                </Link>
                            </li>

                            <li className="flex items-center gap-1.5">
                                <ChevronRight className="h-4 w-4 shrink-0" />
                                <span>Issues</span>
                            </li>

                            <li className="flex items-center gap-1.5">
                                <ChevronRight className="h-4 w-4 shrink-0" />
                                <span className="font-bold text-primary">
                                    {post.trackingCode}
                                </span>
                            </li>
                        </ol>
                    </nav>

                    <Link
                        href="/"
                        className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline sm:text-sm"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to recent posts
                    </Link>
                </div>
            </div>

            <div className="py-8">
                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    <div className="space-y-6 lg:col-span-8">
                        <Post post={post} />

                        <Comments
                            postId={post.id}
                            comments={comments}
                        />
                    </div>

                    <aside className="space-y-4 lg:col-span-4">
                        <Card className={SIDE_CARD_CLASS}>
                            <CardContent className="space-y-3.5 p-5">
                                <h2 className="text-base font-bold text-foreground">
                                    Issue summary
                                </h2>

                                <div className="space-y-2.5 text-xs">
                                    <SummaryRow
                                        icon={Hash}
                                        label="Tracking ID"
                                    >
                                        <span className="font-mono font-bold text-foreground">
                                            {post.trackingCode}
                                        </span>
                                    </SummaryRow>

                                    <SummaryRow
                                        icon={CheckCircle2}
                                        label="Status"
                                    >
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-md px-2 py-0.5 font-extrabold",
                                                STATUS_STYLES[post.status],
                                            )}
                                        >
                                            {STATUS_LABEL[post.status]}
                                        </Badge>
                                    </SummaryRow>

                                    <SummaryRow
                                        icon={AlertTriangle}
                                        label="Priority"
                                    >
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                "rounded-md px-2 py-0.5 font-extrabold",
                                                PRIORITY_STYLES[post.priority],
                                            )}
                                        >
                                            {PRIORITY_LABEL[post.priority]}
                                        </Badge>
                                    </SummaryRow>

                                    <SummaryRow
                                        icon={Tag}
                                        label="Category"
                                    >
                                        <span className="text-right font-bold text-foreground">
                                            {post.category.name}
                                        </span>
                                    </SummaryRow>

                                    <SummaryRow
                                        icon={Building2}
                                        label="Department"
                                    >
                                        <span className="text-right font-bold text-foreground">
                                            {post.department?.name ?? "—"}
                                        </span>
                                    </SummaryRow>

                                    <SummaryRow
                                        icon={User}
                                        label="Officer"
                                    >
                                        <span className="text-right font-bold text-foreground">
                                            {post.assignedOfficer?.name ??
                                                "Unassigned"}
                                        </span>
                                    </SummaryRow>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className={SIDE_CARD_CLASS}>
                            <CardContent className="space-y-3 p-5">
                                <h2 className="text-base font-bold text-foreground">
                                    Location
                                </h2>

                                <div className="space-y-2 text-xs">
                                    <p className="flex items-start gap-2 font-semibold text-foreground">
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        <span>
                                            {post.location.address}
                                        </span>
                                    </p>

                                    {post.location.postalCode && (
                                        <p className="flex items-center gap-2 font-medium text-muted-foreground">
                                            <Navigation className="h-4 w-4 shrink-0" />
                                            {post.location.postalCode}
                                        </p>
                                    )}

                                    {post.ward && (
                                        <p className="flex items-center gap-2 font-medium text-muted-foreground">
                                            <Building2 className="h-4 w-4 shrink-0" />
                                            {post.ward.name}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        className="rounded-xl border-border-custom bg-card p-6 text-md font-bold hover:bg-background cursor-pointer"
                                    >
                                        <Link
                                            href={`/issues-map?trackingCode=${post.trackingCode}`}
                                            className="flex items-center gap-3"
                                        >
                                            <MapPin className="h-6 w-6 text-primary" />
                                            <span>View on issues map</span>
                                        </Link>
                                    </Button>

                                    <Button
                                        className="rounded-xl p-6 text-md font-bold shadow-sm"
                                    >
                                        <Link
                                            href="/report-issue"
                                            className="flex gap-3"
                                        >
                                            <Plus className="h-4 w-4" />
                                            Report a similar issue
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <RelatedPosts relatedPosts={relatedPosts} />
                    </aside>
                </div>
            </div>
        </section>
    );
}
