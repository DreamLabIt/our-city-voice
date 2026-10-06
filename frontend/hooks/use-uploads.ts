"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UploadError, uploadFile } from "@/lib/upload";
import type { UploadKind, UploadedFile } from "@/types";

/**
 * The state behind a file picker: queue, per-file progress, per-file errors.
 *
 * Separate from any UI, so the same behaviour backs the avatar control on the
 * registration form and the media picker on the report form, which look nothing
 * alike. Everything visual lives in the components.
 *
 * Uploads start the moment a file is chosen rather than on submit. By the time
 * somebody presses the button there is already a URL to send, so the submit is
 * fast and a failed upload is reported next to the file that failed instead of
 * taking the whole form down with it.
 *
 * The queue lives in a ref, with state mirroring it for rendering. That is the
 * unusual part and it is deliberate: every mutation here has a side effect
 * attached (revoking an object URL, aborting a request, telling the parent what
 * the finished set is), and side effects do not belong inside a setState updater,
 * which React may run during a render or run twice.
 */

export type SlotStatus = "uploading" | "done" | "error";

export interface UploadSlot {
  id: string;
  name: string;
  size: number;
  status: SlotStatus;
  /** 0 to 100. */
  progress: number;
  error?: string;
  /** Present once the upload finishes. This is what gets submitted. */
  uploaded?: UploadedFile;
  /** A local object URL, so a preview appears before the upload finishes. */
  previewUrl?: string;
  /** Cancels an upload in flight. */
  abort?: () => void;
}

export interface UseUploadsOptions {
  kind: UploadKind;
  /** Replaces the single slot instead of appending when false. */
  multiple?: boolean;
  maxFiles?: number;
  /** Called with every finished upload whenever the set of them changes. */
  onChange?: (files: UploadedFile[]) => void;
}

export interface UseUploads {
  slots: UploadSlot[];
  addFiles: (files: FileList | File[]) => void;
  remove: (id: string) => void;
  reset: () => void;
  isUploading: boolean;
  /** For problems with the batch rather than with one file, such as too many. */
  batchError: string | null;
}

function finished(slots: UploadSlot[]): UploadedFile[] {
  return slots
    .map((slot) => slot.uploaded)
    .filter((uploaded): uploaded is UploadedFile => uploaded !== undefined);
}

/** Frees an object URL and stops an upload. Safe to call on any slot. */
function discard(slot: UploadSlot): void {
  slot.abort?.();
  if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
}

export function useUploads(options: UseUploadsOptions): UseUploads {
  const { kind, multiple = false, maxFiles = multiple ? 8 : 1 } = options;

  const [slots, setSlots] = useState<UploadSlot[]>([]);
  const [batchError, setBatchError] = useState<string | null>(null);

  /** The queue. `slots` is a copy of this, kept only so React re-renders. */
  const queue = useRef<UploadSlot[]>([]);

  // A ref, because an upload finishing reads this from inside a promise created
  // on an earlier render. Reading the prop directly there would call whichever
  // version of onChange existed when the upload started.
  const onChangeRef = useRef(options.onChange);
  useEffect(() => {
    onChangeRef.current = options.onChange;
  }, [options.onChange]);

  const commit = useCallback((next: UploadSlot[], announce: boolean) => {
    queue.current = next;
    setSlots(next);
    if (announce) onChangeRef.current?.(finished(next));
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<UploadSlot>, announce = false) => {
      commit(
        queue.current.map((slot) => (slot.id === id ? { ...slot, ...changes } : slot)),
        announce,
      );
    },
    [commit],
  );

  const start = useCallback(
    (id: string, file: File) => {
      const controller = new AbortController();
      patch(id, { abort: () => controller.abort() });

      uploadFile(file, kind, {
        signal: controller.signal,
        onProgress: (progress) => patch(id, { progress }),
      })
        .then((uploaded) => {
          patch(id, { status: "done", progress: 100, uploaded, abort: undefined }, true);
        })
        .catch((error: unknown) => {
          patch(id, {
            status: "error",
            abort: undefined,
            error:
              error instanceof UploadError
                ? error.message
                : "Something went wrong uploading that file.",
          });
        });
    },
    [kind, patch],
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (files.length === 0) return;

      // Single-file mode replaces rather than refusing, which is what somebody
      // picking a different profile photo expects.
      const kept = multiple ? queue.current : [];
      if (!multiple) queue.current.forEach(discard);

      const room = Math.max(0, maxFiles - kept.length);
      const accepted = multiple ? files.slice(0, room) : files.slice(0, 1);

      setBatchError(
        accepted.length < files.length
          ? `You can attach up to ${maxFiles} file${maxFiles === 1 ? "" : "s"}.`
          : null,
      );
      if (accepted.length === 0) return;

      const created = accepted.map((file) => ({
        file,
        slot: {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          status: "uploading" as const,
          progress: 0,
          // Video gets an icon instead. Rendering a <video> for a thumbnail
          // means decoding the whole file the person is still uploading.
          ...(file.type.startsWith("image/") ? { previewUrl: URL.createObjectURL(file) } : {}),
        } satisfies UploadSlot,
      }));

      // Announced, because replacing a finished file in single mode has already
      // changed what the parent holds even though nothing has uploaded yet.
      commit([...kept, ...created.map((entry) => entry.slot)], true);

      for (const entry of created) start(entry.slot.id, entry.file);
    },
    [commit, maxFiles, multiple, start],
  );

  const remove = useCallback(
    (id: string) => {
      const target = queue.current.find((slot) => slot.id === id);
      if (!target) return;

      discard(target);
      setBatchError(null);
      commit(
        queue.current.filter((slot) => slot.id !== id),
        true,
      );
    },
    [commit],
  );

  const reset = useCallback(() => {
    queue.current.forEach(discard);
    setBatchError(null);
    commit([], true);
  }, [commit]);

  // Object URLs are held by the browser until revoked, so leaving the page mid
  // upload would leak every preview and keep every request alive.
  useEffect(
    () => () => {
      queue.current.forEach(discard);
    },
    [],
  );

  return {
    slots,
    addFiles,
    remove,
    reset,
    isUploading: slots.some((slot) => slot.status === "uploading"),
    batchError,
  };
}
