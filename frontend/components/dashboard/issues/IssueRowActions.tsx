"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Report } from "@/types/report";
import { deleteReport, updateReport, } from "@/app/actions/issues";
import { ReportPriority, UpdateReportInput, EditOption, EditState } from "@/types/issues";

interface IssueRowActionsProps {
    issue: Report;
    categories: EditOption[];
    wards: EditOption[];
}

function toEditState(issue: Report): EditState {
    return {
        title: issue.title ?? "",
        description: issue.description ?? "",
        category: issue.category?.slug ?? "",
        ward: issue.ward?.code ?? "",
        priority: issue.priority as ReportPriority,
        isAnonymous: Boolean(issue.isAnonymous),
        city: issue.city ?? "",
        address: issue.address ?? "",
        street: issue.street ?? "",
        postalCode: issue.postalCode ?? "",
    };
}

function buildDiff(original: EditState, current: EditState): UpdateReportInput {
    const diff: UpdateReportInput = {};

    if (current.title.trim() !== original.title) {
        diff.title = current.title.trim();
    }
    if (current.description.trim() !== original.description) {
        diff.description = current.description.trim();
    }
    if (current.category !== original.category) {
        diff.category = current.category;
    }
    if (current.ward !== original.ward) {
        diff.ward = current.ward;
    }
    if (current.priority !== original.priority) {
        diff.priority = current.priority;
    }
    if (current.isAnonymous !== original.isAnonymous) {
        diff.isAnonymous = current.isAnonymous;
    }

    const location: NonNullable<UpdateReportInput["location"]> = {};

    if (current.city.trim() !== original.city) {
        location.city = current.city.trim();
    }
    if (current.address.trim() !== original.address) {
        location.address = current.address.trim();
    }
    if (current.street.trim() !== original.street) {
        location.street = current.street.trim() || null;
    }
    if (current.postalCode.trim() !== original.postalCode) {
        location.postalCode = current.postalCode.trim() || null;
    }

    if (Object.keys(location).length > 0) {
        diff.location = location;
    }

    return diff;
}

function validate(form: EditState): Record<string, string> {
    const errors: Record<string, string> = {};
    const title = form.title.trim();
    const description = form.description.trim();

    if (title.length < 6 || title.length > 160) {
        errors.title = "Title must be 6 to 160 characters.";
    }
    if (description.length < 15 || description.length > 5000) {
        errors.description = "Description must be 15 to 5000 characters.";
    }
    if (!form.category) errors.category = "Category is required.";
    if (!form.ward) errors.ward = "Ward is required.";
    if (!form.city.trim() || form.city.trim().length > 80) {
        errors.city = "City is required (max 80 characters).";
    }
    if (!form.address.trim() || form.address.trim().length > 240) {
        errors.address = "Address is required (max 240 characters).";
    }
    if (form.street.trim().length > 160) {
        errors.street = "Street must not exceed 160 characters.";
    }
    if (form.postalCode.trim().length > 16) {
        errors.postalCode = "Postal code must not exceed 16 characters.";
    }

    return errors;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-xs font-bold uppercase tracking-wide text-foreground">
            {children}
        </label>
    );
}

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-xs text-destructive">{message}</p>;
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

    const original = toEditState(issue);
    const [form, setForm] = useState<EditState>(original);

    const diff = buildDiff(original, form);
    const hasChanges = Object.keys(diff).length > 0;
    const errors = validate(form);
    const isValid = Object.keys(errors).length === 0;

    const setField = <K extends keyof EditState>(
        key: K,
        value: EditState[K],
    ): void => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const openEdit = (): void => {
        setForm(toEditState(issue));
        setEditOpen(true);
    };

    const handleSave = (): void => {
        if (!hasChanges || !isValid) return;

        startTransition(async () => {
            const result = await updateReport(issue.trackingCode, diff);

            if (!result.success) {
                if (result.requiresAuth) {
                    toast.error("Please log in again.");
                    router.push("/login?next=/dashboard/issues");
                    return;
                }

                const detail = result.fieldErrors
                    ? Object.values(result.fieldErrors).flat().join(" ")
                    : "";

                toast.error("Failed to update report", {
                    description: detail || result.error,
                });
                return;
            }

            toast.success("Report updated.");
            setEditOpen(false);
            router.refresh();
        });
    };

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
                    onClick={openEdit}
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

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
                    <DialogHeader>
                        <DialogTitle>Edit report</DialogTitle>
                        <DialogDescription>
                            Only the fields you change are saved.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <FieldLabel>Title</FieldLabel>
                            <Input
                                value={form.title}
                                onChange={(e) =>
                                    setField("title", e.target.value)
                                }
                            />
                            <FieldError message={errors.title} />
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Description</FieldLabel>
                            <Textarea
                                rows={4}
                                value={form.description}
                                onChange={(e) =>
                                    setField("description", e.target.value)
                                }
                            />
                            <FieldError message={errors.description} />
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <FieldLabel>Category</FieldLabel>
                                <Select
                                    value={form.category}
                                    onValueChange={(v) =>
                                        setField("category", v ?? "")
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map((c) => (
                                            <SelectItem
                                                key={c.value}
                                                value={c.value}
                                            >
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.category} />
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Ward</FieldLabel>
                                <Select
                                    value={form.ward}
                                    onValueChange={(v) =>
                                        setField("ward", v ?? "")
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select ward" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {wards.map((w) => (
                                            <SelectItem
                                                key={w.value}
                                                value={w.value}
                                            >
                                                {w.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError message={errors.ward} />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <FieldLabel>Priority</FieldLabel>
                            <Select
                                value={form.priority}
                                onValueChange={(v) =>
                                    setField("priority", v as ReportPriority)
                                }
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">
                                        Medium
                                    </SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">
                                        Critical
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="space-y-1.5">
                                <FieldLabel>City</FieldLabel>
                                <Input
                                    value={form.city}
                                    onChange={(e) =>
                                        setField("city", e.target.value)
                                    }
                                />
                                <FieldError message={errors.city} />
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Address</FieldLabel>
                                <Input
                                    value={form.address}
                                    onChange={(e) =>
                                        setField("address", e.target.value)
                                    }
                                />
                                -                 <FieldError message={errors.address} />
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Street (Optional)</FieldLabel>
                                <Input
                                    value={form.street}
                                    onChange={(e) =>
                                        setField("street", e.target.value)
                                    }
                                />
                                <FieldError message={errors.street} />
                            </div>

                            <div className="space-y-1.5">
                                <FieldLabel>Postal Code (Optional)</FieldLabel>
                                <Input
                                    value={form.postalCode}
                                    onChange={(e) =>
                                        setField("postalCode", e.target.value)
                                    }
                                />
                                <FieldError message={errors.postalCode} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id={`anonymous-${issue.id}`}
                                checked={form.isAnonymous}
                                onCheckedChange={(checked) =>
                                    setField("isAnonymous", !!checked)
                                }
                            />
                            <label
                                htmlFor={`anonymous-${issue.id}`}
                                className="cursor-pointer text-xs font-medium text-muted-foreground"
                            >
                                Submit Anonymously
                            </label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditOpen(false)}
                            disabled={isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={isPending || !hasChanges || !isValid}
                        >
                            {isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this report?</AlertDialogTitle>
                        <AlertDialogDescription>
                            &quot;{issue.title}&quot; will be removed from the
                            public site. Its comments are kept.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDelete();
                            }}
                            disabled={isPending}
                            className="bg-destructive text-white hover:bg-destructive/90"
                        >
                            {isPending && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}