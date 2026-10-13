"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteReport } from "@/app/actions/issues";
import DeleteIssueDialog from "@/components/dashboard/issues/DeleteIssueDialog";
import EditIssueDialog from "@/components/dashboard/issues/EditIssueDialog";
import { Button } from "@/components/ui/button";
import type { EditOption } from "@/types/issues";
import type { Report } from "@/types/report";

interface IssueRowActionsProps {
    issue: Report;
    categories: EditOption[];
    wards: EditOption[];
}

export default function IssueRowActions({
    issue,
    categories,
    wards,
}: IssueRowActionsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const [editOpen, setEditOpen] = useState(false);
    const [deleteOpen, setDeleteOpen] = useState(false);

    const handleDelete = (): void => {
        startTransition(async () => {
            const result = await deleteReport(issue.trackingCode);

            if (!result.success) {
                if (result.requiresAuth) {
                    toast.error("Please log in again.");
                    router.push("/login?next=/dashboard/issues");
                    return;
                }

                toast.error("Failed to delete report", {
                    description: result.error,
                });
                return;
            }

            toast.success("Report deleted.");
            setDeleteOpen(false);
            router.refresh();
        });
    };

    return (
        <>
            <div className="flex items-center justify-end gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-primary hover:bg-primary/10"
                >
                    <Link
                        href={`/issues/${issue.trackingCode}`}
                        aria-label={`View ${issue.title}`}
                    >
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditOpen(true)}
                    disabled={isPending}
                    aria-label={`Edit ${issue.title}`}
                    className="text-amber-600 hover:bg-amber-50"
                >
                    <Pencil className="h-4 w-4" />
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteOpen(true)}
                    disabled={isPending}
                    aria-label={`Delete ${issue.title}`}
                    className="text-destructive hover:bg-destructive/10"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            {editOpen && (
                <EditIssueDialog
                    issue={issue}
                    categories={categories}
                    wards={wards}
                    onClose={() => setEditOpen(false)}
                />
            )}

            <DeleteIssueDialog
                issue={issue}
                open={deleteOpen}
                isPending={isPending}
                onOpenChange={setDeleteOpen}
                onConfirm={handleDelete}
            />
        </>
    );
}