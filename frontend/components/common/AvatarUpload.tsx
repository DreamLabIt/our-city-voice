"use client";

import { useId } from "react";
import { AlertCircle, Loader2, Trash2, Upload, UserRound } from "lucide-react";

import Image from "next/image";
import type { UseUploads } from "@/hooks/use-uploads";

export interface AvatarUploadProps {
    uploads: UseUploads;
    disabled?: boolean;
    label?: string;
    className?: string;
}

export default function AvatarUpload({
    uploads,
    disabled = false,
    label = "Profile photo (optional)",
    className = "",
}: AvatarUploadProps) {
    const inputId = useId();
    const slot = uploads.slots[0];

    return (
        <div className={`space-y-1.5 ${className}`}>
            <span className="text-xs font-semibold text-foreground">{label}</span>

            <input
                id={inputId}
                type="file"
                accept={uploads.accept}
                disabled={disabled}
                className="hidden"
                onChange={(event) => {
                    if (event.target.files) uploads.addFiles(event.target.files);
                    event.target.value = "";
                }}
            />

            <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                    {slot?.previewUrl ? (

                        <Image
                            src={slot.previewUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            width={100}
                            height={100}
                        />
                    ) : (
                        <UserRound className="w-5 h-5 text-muted-foreground" />
                    )}

                    {slot?.status === "uploading" && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <label
                        htmlFor={inputId}
                        className={`flex items-center justify-between gap-2 px-3.5 h-10 rounded-xl border border-dashed text-xs transition-colors ${disabled
                            ? "border-border bg-muted/20 text-muted-foreground cursor-not-allowed opacity-60"
                            : "border-border bg-muted/30 hover:bg-muted/60 text-muted-foreground cursor-pointer"
                            }`}
                    >
                        <span className="truncate">{slot ? slot.name : "Choose a photo..."}</span>
                        <Upload className="w-4 h-4 shrink-0" />
                    </label>

                    {slot?.status === "uploading" && (
                        <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-[width] duration-150"
                                style={{ width: `${slot.progress}%` }}
                            />
                        </div>
                    )}
                </div>

                {slot && (
                    <button
                        type="button"
                        onClick={() => uploads.remove(slot.id)}
                        disabled={disabled}
                        aria-label="Remove photo"
                        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                )}
            </div>

            {(slot?.error || uploads.batchError) && (
                <p className="text-[11px] text-destructive flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {slot?.error ?? uploads.batchError}
                </p>
            )}
        </div>
    );
}
