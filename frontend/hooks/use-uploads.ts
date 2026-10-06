"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { UploadError, checkFile, uploadFile } from "@/lib/upload";
import { UPLOAD_RULES } from "@/lib/upload-rules";
import type { UploadKind, UploadedFile } from "@/types";

/**
 * The state behind a file picker: queue, per-file progress, per-file errors.
 *
 * Separate from any UI, so the same behaviour backs the avatar control on the
 * registration form and the media picker on the report form, which look nothing
 * alike. Everything visual lives in the components.
 *
 * Nothing is sent until the form calls `upload()`. Choosing a file only puts it
 * in the queue with a local preview. Uploading as soon as a file was chosen made
 * the submit instant, but every abandoned form, every replaced photo and every
 * press of the remove button left a file in Cloudinary that nothing would ever
 * refer to or delete. The cost is a slower submit, which is at least visible:
 * the form can show progress while it happens.
 *
 * Because `upload()` is what starts the work, the hook has to live in the form
 * rather than in the picker, and the picker takes what this returns as a prop.
 *
 * The queue lives in a ref, with state mirroring it for rendering. That is the
 * unusual part and it is deliberate: `upload()` reads the finished set straight
 * after the last file lands, and reading it from `slots` would read whatever was
 * there when the promise was created. The ref is also what lets the mutations
 * carry side effects (revoking an object URL, aborting a request) without
 * putting them inside a setState updater, which React may run twice.
 */

/**
 * "rejected" and "error" look the same on screen and are not the same thing.
 * A file the size or format check turned away will be turned away every time, so
 * submitting again is pointless. An upload that failed on the way to Cloudinary
 * usually succeeds on a second try, and refusing to retry it would strand
 * somebody on a form they cannot submit until they remove a perfectly good photo.
 */
export type SlotStatus = "pending" | "uploading" | "done" | "error" | "rejected";

export interface UploadSlot {
  id: string;
  /** Held until submit, which is the whole point of this hook. */
  file: File;
  name: string;
  size: number;
  status: SlotStatus;
  /** 0 to 100. Only moves while the status is "uploading". */
  progress: number;
  error?: string;
  /** Present once the upload finishes. This is what gets submitted. */
  uploaded?: UploadedFile;
  /** A local object URL, so a preview appears without uploading anything. */
  previewUrl?: string;
  /** Cancels an upload in flight. */
  abort?: () => void;
}

export interface UseUploadsOptions {
  kind: UploadKind;
  /** Replaces the single slot instead of appending when false. */
  multiple?: boolean;
  maxFiles?: number;
}

export interface UseUploads {
  slots: UploadSlot[];
  addFiles: (files: FileList | File[]) => void;
  remove: (id: string) => void;
  reset: () => void;
  /**
   * Uploads everything in the queue that is not already uploaded.
   *
   * Resolves with the finished files in queue order, or with null when anything
   * failed, in which case the failure is on the slot it belongs to and the form
   * should stop. Already-uploaded files are skipped, so retrying a submit that
   * the API rejected does not send the same photo twice.
   */
  upload: () => Promise<UploadedFile[] | null>;
  isUploading: boolean;
  /** Across the whole queue, weighted by file size. */
  progress: number;
  /** For problems with the batch rather than with one file, such as too many. */
  batchError: string | null;
  /** From UPLOAD_RULES, for the file input. */
  accept: string;
  multiple: boolean;
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

  const commit = useCallback((next: UploadSlot[]) => {
    queue.current = next;
    setSlots(next);
  }, []);

  const patch = useCallback(
    (id: string, changes: Partial<UploadSlot>) => {
      commit(queue.current.map((slot) => (slot.id === id ? { ...slot, ...changes } : slot)));
    },
    [commit],
  );

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      const files = Array.from(incoming);
      if (files.length === 0) return;

      // Single-file mode replaces rather than refusing, which is what somebody
      // picking a different profile photo expects. Nothing has been uploaded at
      // this point, so the one being dropped costs nothing.
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

      const created = accepted.map((file) => {
        // A file that is too big or the wrong type still gets a slot, in the
        // error state. The alternative is one banner for the whole batch, which
        // does not say which of four files was the problem.
        const problem = checkFile(file, kind);

        return {
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          status: problem ? ("rejected" as const) : ("pending" as const),
          progress: 0,
          ...(problem ? { error: problem } : {}),
          // Video gets an icon instead. Rendering a <video> for a thumbnail
          // means decoding a file that may be 50MB.
          ...(file.type.startsWith("image/") ? { previewUrl: URL.createObjectURL(file) } : {}),
        } satisfies UploadSlot;
      });

      commit([...kept, ...created]);
    },
    [commit, kind, maxFiles, multiple],
  );

  const upload = useCallback(async (): Promise<UploadedFile[] | null> => {
    // Nothing is sent while a file is sitting there rejected, because it would
    // mean creating the account without the photo they chose and not saying so.
    if (queue.current.some((slot) => slot.status === "rejected")) return null;

    const targets = queue.current.filter((slot) => !slot.uploaded);

    // One at a time, stopping at the first failure. Parallel would finish sooner,
    // but this way the progress bar means something and a submit that cannot
    // succeed leaves fewer files behind in Cloudinary than it otherwise would.
    for (const target of targets) {
      const controller = new AbortController();
      patch(target.id, {
        status: "uploading",
        progress: 0,
        error: undefined,
        abort: () => controller.abort(),
      });

      try {
        const uploaded = await uploadFile(target.file, kind, {
          signal: controller.signal,
          onProgress: (progress) => patch(target.id, { progress }),
        });
        patch(target.id, { status: "done", progress: 100, uploaded, abort: undefined });
      } catch (error) {
        patch(target.id, {
          status: "error",
          abort: undefined,
          error:
            error instanceof UploadError
              ? error.message
              : "Something went wrong uploading that file.",
        });
        return null;
      }
    }

    // Read off the ref, which patch has kept current, rather than off `slots`,
    // which is a render behind.
    return queue.current
      .map((slot) => slot.uploaded)
      .filter((uploaded): uploaded is UploadedFile => uploaded !== undefined);
  }, [kind, patch]);

  const remove = useCallback(
    (id: string) => {
      const target = queue.current.find((slot) => slot.id === id);
      if (!target) return;

      discard(target);
      setBatchError(null);
      commit(queue.current.filter((slot) => slot.id !== id));
    },
    [commit],
  );

  const reset = useCallback(() => {
    queue.current.forEach(discard);
    setBatchError(null);
    commit([]);
  }, [commit]);

  // Object URLs are held by the browser until revoked, so leaving the page mid
  // submit would leak every preview and keep the request alive.
  useEffect(
    () => () => {
      queue.current.forEach(discard);
    },
    [],
  );

  // Weighted by size, because one 40MB video among three small photos makes an
  // average of the four percentages read as almost done when it is not.
  const totalBytes = slots.reduce((sum, slot) => sum + slot.size, 0);
  const progress =
    totalBytes === 0
      ? 0
      : Math.round(
          slots.reduce(
            (sum, slot) => sum + slot.size * (slot.uploaded ? 100 : slot.progress),
            0,
          ) / totalBytes,
        );

  return {
    slots,
    addFiles,
    remove,
    reset,
    upload,
    isUploading: slots.some((slot) => slot.status === "uploading"),
    progress,
    batchError,
    accept: UPLOAD_RULES[kind].accept.join(","),
    multiple,
  };
}
