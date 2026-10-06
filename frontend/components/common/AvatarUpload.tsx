"use client";

import { useEffect, useId } from "react";
import { AlertCircle, Loader2, Trash2, Upload, UserRound } from "lucide-react";

import { useUploads } from "@/hooks/use-uploads";
import type { UploadedFile } from "@/types";
import Image from "next/image";

/**
 * A single optional profile photo.
 *
 * Same hook as FileUpload, different shape: one round preview and one line of
 * text, because this sits among the inputs on a signup form rather than being a
 * drop target of its own.
 */

export interface AvatarUploadProps {
  onChange: (file: UploadedFile | null) => void;
  /**
   * Fires while an upload is in flight, so the form can keep its submit button
   * disabled. Without it, submitting a second after choosing a photo creates the
   * account with no avatar and no explanation.
   */
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function AvatarUpload({
  onChange,
  onUploadingChange,
  disabled = false,
  label = "Profile photo (optional)",
  className = "",
}: AvatarUploadProps) {
  const inputId = useId();

  const uploads = useUploads({
    kind: "avatar",
    multiple: false,
    onChange: (files) => onChange(files[0] ?? null),
  });

  // Reported through an effect rather than from inside the upload callbacks,
  // which would miss the start of an upload and every failure.
  useEffect(() => {
    onUploadingChange?.(uploads.isUploading);
  }, [uploads.isUploading, onUploadingChange]);

  const slot = uploads.slots[0];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <span className="text-xs font-semibold text-foreground">{label}</span>

      <input
        id={inputId}
        type="file"
        accept="image/*"
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          if (event.target.files) uploads.addFiles(event.target.files);
          // So re-picking the same file after removing it still fires a change.
          event.target.value = "";
        }}
      />

      <div className="flex items-center gap-3">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
          {slot?.previewUrl ? (
            // A blob: URL from the local file, which the next/image optimiser
            // cannot fetch. The uploaded copy is never shown here, so there is
            // nothing for it to optimise anyway.
            // eslint-disable-next-line @next/next/no-img-element
            <Image src={slot.previewUrl} alt="" className="w-full h-full object-cover" />
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
            <span className="truncate">
              {slot ? slot.name : "Choose a photo..."}
            </span>
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
            aria-label="Remove photo"
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {(slot?.status === "error" || uploads.batchError) && (
        <p className="text-[11px] text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {slot?.error ?? uploads.batchError}
        </p>
      )}
    </div>
  );
}
