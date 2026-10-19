"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateUserRole } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { isUserRole, ROLE_LABEL, type UserRole } from "./user-utils";
import { UserRoleSelectProps } from "@/types/user";

export default function UserRoleSelect({
    userId,
    userName,
    role,
    isSelf,
}: UserRoleSelectProps) {
    const router = useRouter();
    const [pendingRole, setPendingRole] = useState<UserRole | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSelect = (value: string | null): void => {
        if (!isUserRole(value) || value === role) return;

        setErrorMessage(null);
        setPendingRole(value);
    };

    const handleClose = (): void => {
        if (isSaving) return;

        setPendingRole(null);
        setErrorMessage(null);
    };

    const handleConfirm = async (): Promise<void> => {
        if (!pendingRole) return;

        setIsSaving(true);
        setErrorMessage(null);

        const result = await updateUserRole(userId, pendingRole);

        setIsSaving(false);

        if (!result.success) {
            if (result.requiresAuth) {
                toast.error(result.error ?? "Please log in again.");
                router.push("/login?next=/dashboard/users");
                return;
            }

            setErrorMessage(
                result.fieldErrors?.role?.[0] ??
                result.error ??
                "Failed to update the role.",
            );
            return;
        }

        const promoted = pendingRole === "super_admin";

        toast.success(`${userName} is now ${ROLE_LABEL[pendingRole]}`, {
            description: promoted
                ? "They must sign in again to get super admin access."
                : "Their active sessions were ended.",
        });

        setPendingRole(null);
        router.refresh();
    };

    return (
        <>
            <div
                title={isSelf ? "You cannot change your own role" : undefined}
                className="w-36"
            >
                <Select
                    value={role}
                    onValueChange={handleSelect}
                    disabled={isSelf}
                >
                    <SelectTrigger className="w-full text-xs font-semibold">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user">{ROLE_LABEL.user}</SelectItem>
                        <SelectItem value="super_admin">
                            {ROLE_LABEL.super_admin}
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Dialog
                open={pendingRole !== null}
                onOpenChange={(open) => {
                    if (!open) handleClose();
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Change role</DialogTitle>
                        <DialogDescription>
                            Change <strong>{userName}</strong> from{" "}
                            <strong>{ROLE_LABEL[role]}</strong> to{" "}
                            <strong>
                                {pendingRole ? ROLE_LABEL[pendingRole] : ""}
                            </strong>
                            ?
                        </DialogDescription>
                    </DialogHeader>

                    <p className="text-xs text-muted-foreground">
                        {pendingRole === "super_admin"
                            ? "This ends all of their active sessions. They must sign in again to get super admin access."
                            : "This ends all of their active sessions and removes their admin access."}
                    </p>

                    {errorMessage && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs font-medium text-destructive"
                        >
                            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <DialogFooter className="border-t-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={() => void handleConfirm()}
                            disabled={isSaving}
                        >
                            {isSaving && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}