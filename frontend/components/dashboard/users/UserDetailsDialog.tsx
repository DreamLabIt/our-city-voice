"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";
import { getUserDetails } from "@/app/actions/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { getInitials } from "@/lib/utils";
import type { AuthUser } from "@/types";
import {
    formatDate,
    isUserRole,
    ROLE_LABEL,
    ROLE_STYLES,
} from "./user-utils";
import { UserDetailsDialogProps } from "@/types/user";

type LoadState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "ready"; user: AuthUser };

function DetailRow({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs">
            <dt className="font-semibold text-muted-foreground">{label}</dt>
            <dd className="min-w-0 wrap-break-word text-right font-bold text-foreground">
                {children}
            </dd>
        </div>
    );
}

export default function UserDetailsDialog({
    userId,
    userName,
}: UserDetailsDialogProps) {
    const router = useRouter();

    const [isOpen, setIsOpen] = useState(false);
    const [state, setState] = useState<LoadState>({ status: "idle" });

    const loadUser = async (): Promise<void> => {
        setState({ status: "loading" });

        const result = await getUserDetails(userId);

        if (!result.success || !result.data) {
            if (result.requiresAuth) {
                router.push("/login?next=/dashboard/users");
                return;
            }

            setState({
                status: "error",
                message: result.error ?? "Failed to load the user details.",
            });
            return;
        }

        setState({ status: "ready", user: result.data });
    };

    const handleOpenChange = (open: boolean): void => {
        setIsOpen(open);

        if (open) {
            void loadUser();
        }
    };

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleOpenChange(true)}
                aria-label={`View details of ${userName}`}
                title="View details"
                className="cursor-pointer text-muted-foreground hover:text-primary"
            >
                <Eye className="h-4 w-4" />
            </Button>

            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>User details</DialogTitle>
                        <DialogDescription>
                            Account information for {userName}.
                        </DialogDescription>
                    </DialogHeader>

                    {(state.status === "idle" || state.status === "loading") && (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Loading...
                        </div>
                    )}

                    {state.status === "error" && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                        >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{state.message}</span>
                        </div>
                    )}

                    {state.status === "ready" && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="size-14">
                                    {state.user.avatarUrl && (
                                        <AvatarImage
                                            src={state.user.avatarUrl}
                                            alt={state.user.name}
                                        />
                                    )}
                                    <AvatarFallback className="bg-tag-blue-bg text-sm font-extrabold text-tag-blue-text">
                                        {getInitials(state.user.name) || "?"}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="min-w-0 space-y-1">
                                    <p className="truncate text-base font-bold text-foreground">
                                        {state.user.name}
                                    </p>

                                    {isUserRole(state.user.role) && (
                                        <Badge
                                            variant="secondary"
                                            className={ROLE_STYLES[state.user.role]}
                                        >
                                            {ROLE_LABEL[state.user.role]}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <dl className="space-y-2">
                                <DetailRow label="User ID">
                                    <span className="font-mono">
                                        #{state.user.id}
                                    </span>
                                </DetailRow>
                                <DetailRow label="Email">
                                    {state.user.email}
                                </DetailRow>
                                <DetailRow label="Phone">
                                    {state.user.phone || "-"}
                                </DetailRow>
                                <DetailRow label="Email verified">
                                    {state.user.emailVerifiedAt
                                        ? formatDate(state.user.emailVerifiedAt)
                                        : "Not verified"}
                                </DetailRow>
                                <DetailRow label="Department">
                                    {state.user.departmentId ?? "-"}
                                </DetailRow>
                                <DetailRow label="Joined">
                                    {formatDate(state.user.createdAt)}
                                </DetailRow>
                            </dl>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}