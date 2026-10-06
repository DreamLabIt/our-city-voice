"use client";

import { useId, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Film, ImageIcon, Loader2, Upload, X } from "lucide-react";

import { useUploads } from "@/hooks/use-uploads";
import { formatBytes } from "@/lib/upload";
import type { UploadKind, UploadedFile } from "@/types";
import Image from "next/image";

/**
 * The general file picker: drop zone, thumbnails, per-file progress.
 *
 * Built for report media, where several images and a video can be attached at
 * once, and usable anywhere else that wants the same control. The avatar field
 * on the registration form needs a different shape entirely, so it has its own
 * component over the same hook rather than a variant flag here.
 */

export interface FileUploadProps {
  /** Decides the folder, size cap and accepted formats. The server owns those. */
  kind: UploadKind;
  onChange: (files: UploadedFile[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  label?: string;
  hint?: string;
  className?: string;
}

export default function FileUpload({
  kind,
  onChange,
  multiple = true,
  maxFiles,
  disabled = false,
  label = "Photos and video",
  hint = "Drag files here, or click to choose.",
  className = "",
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const uploads = useUploads({
    kind,
    multiple,
    ...(maxFiles === undefined ? {} : { maxFiles }),
    onChange,
  });

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>): void => {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (event.dataTransfer.files.length > 0) uploads.addFiles(event.dataTransfer.files);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        {uploads.slots.length > 0 && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {uploads.slots.filter((slot) => slot.status === "done").length} of{" "}
            {uploads.slots.length} ready
          </span>
        )}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          if (event.target.files) uploads.addFiles(event.target.files);
          // Cleared so choosing the same file twice in a row still fires a
          // change event. Without this, removing a file and picking it again
          // does nothing at all.
          event.target.value = "";
        }}
      />

      <label
        htmlFor={inputId}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center gap-2 px-4 py-8 rounded-xl border border-dashed text-center transition-colors ${disabled
            ? "border-border bg-muted/20 cursor-not-allowed opacity-60"
            : isDragging
              ? "border-primary bg-primary/5 cursor-pointer"
              : "border-border bg-muted/30 hover:bg-muted/60 cursor-pointer"
          }`}
      >
        <Upload className="w-5 h-5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{hint}</span>
      </label>

      {uploads.batchError && (
        <p className="text-[11px] text-destructive flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {uploads.batchError}
        </p>
      )}

      {uploads.slots.length > 0 && (
        <ul className="space-y-2">
          {uploads.slots.map((slot) => (
            <li
              key={slot.id}
              className="flex items-center gap-3 p-2.5 rounded-xl border border-border bg-card"
            >
              <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {slot.previewUrl ? (
                  // A plain img, not next/image: this is a blob: URL from the
                  // local file and the image optimiser cannot fetch one.
                  // eslint-disable-next-line @next/next/no-img-element
                  <Image src={slot.previewUrl} alt="" className="w-full h-full object-cover" />
                ) : slot.uploaded?.resourceType === "video" ? (
                  <Film className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ImageIcon className="w-4 h-4 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-foreground truncate">{slot.name}</span>
                  <span className="text-[11px] text-muted-foreground shrink-0 tabular-nums">
                    {formatBytes(slot.size)}
                  </span>
                </div>

                {slot.status === "uploading" && (
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-[width] duration-150"
                      style={{ width: `${slot.progress}%` }}
                    />
                  </div>
                )}

                {slot.status === "error" && (
                  <p className="text-[11px] text-destructive">{slot.error}</p>
                )}
              </div>

              <div className="shrink-0 flex items-center gap-1">
                {slot.status === "uploading" && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                )}
                {slot.status === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-primary" />}
                {slot.status === "error" && (
                  <AlertCircle className="w-3.5 h-3.5 text-destructive" />
                )}

                <button
                  type="button"
                  onClick={() => uploads.remove(slot.id)}
                  aria-label={`Remove ${slot.name}`}
                  className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
