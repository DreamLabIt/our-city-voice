import { UPLOAD_RULES } from "@/lib/upload-rules";
import type { UploadKind, UploadedFile } from "@/types";

/**
 * Browser-side uploading. Runs in the client, talks to two endpoints:
 *
 *   1. our own /api/uploads/signature, for a scoped permission
 *   2. Cloudinary, with the file
 *
 * The file never touches the Next.js server, so there is no body size limit to
 * raise and no memory spent holding a video while it is being forwarded.
 */

/** Carries a message that is already fit to show somebody. */
export class UploadError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "UploadError";
    this.cause = cause;
  }
}

interface UploadTicket {
  uploadUrl: string;
  fields: Record<string, string>;
  constraints: {
    maxBytes: number;
    accept: string[];
    resourceType: "image" | "auto";
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/**
 * The size and format check, run when a file is chosen rather than when it is
 * sent. Returns a message fit to show somebody, or null when the file is fine.
 *
 * Needed as its own function because uploading happens on submit now. Left to
 * uploadFile, a 60MB video would look accepted for as long as the person took to
 * finish the form and only be refused once they pressed the button.
 */
export function checkFile(file: File, kind: UploadKind): string | null {
  const rules = UPLOAD_RULES[kind];

  if (file.size > rules.maxBytes) {
    return `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(rules.maxBytes)}.`;
  }

  // Empty type means the browser could not work out what the file is. Cloudinary
  // decides that one, since allowed_formats is signed.
  if (file.type && !rules.accept.includes(file.type)) {
    return `${file.name} is not a file type we can accept.`;
  }

  return null;
}

async function requestTicket(kind: UploadKind): Promise<UploadTicket> {
  const response = await fetch("/api/uploads/signature", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new UploadError(payload?.error?.message ?? "Could not start the upload.");
  }

  return (await response.json()) as UploadTicket;
}

/**
 * XMLHttpRequest, not fetch.
 *
 * fetch still cannot report upload progress in any browser: its streaming
 * request bodies are not supported where it matters, and there is no equivalent
 * of xhr.upload.onprogress. A 40MB video with no progress bar looks broken.
 */
function putToCloudinary(
  ticket: UploadTicket,
  file: File,
  onProgress: ((percent: number) => void) | undefined,
  signal: AbortSignal | undefined,
): Promise<UploadedFile> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    // Verbatim. These are signed, so changing any of them here would break the
    // signature, and this code has no idea what they mean.
    for (const [key, value] of Object.entries(ticket.fields)) {
      form.append(key, value);
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", ticket.uploadUrl, true);

    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (!event.lengthComputable) return;
        onProgress(Math.round((event.loaded / event.total) * 100));
      });
    }

    const onAbort = (): void => xhr.abort();
    signal?.addEventListener("abort", onAbort);

    const done = (): void => signal?.removeEventListener("abort", onAbort);

    xhr.addEventListener("load", () => {
      done();

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(xhr.responseText) as Record<string, unknown>;
      } catch {
        reject(new UploadError("The upload service returned something unreadable."));
        return;
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        // Cloudinary's own message is specific and worth showing: "File size too
        // large", "Format not allowed" and so on.
        const message = (payload.error as { message?: string } | undefined)?.message;
        reject(new UploadError(message ?? `Upload failed (${xhr.status}).`));
        return;
      }

      resolve({
        url: String(payload.secure_url ?? ""),
        publicId: String(payload.public_id ?? ""),
        resourceType: payload.resource_type === "video" ? "video" : "image",
        format: String(payload.format ?? ""),
        bytes: Number(payload.bytes ?? file.size),
        width: typeof payload.width === "number" ? payload.width : null,
        height: typeof payload.height === "number" ? payload.height : null,
        durationSeconds: typeof payload.duration === "number" ? payload.duration : null,
        originalFilename:
          typeof payload.original_filename === "string" ? payload.original_filename : file.name,
      });
    });

    xhr.addEventListener("error", () => {
      done();
      reject(new UploadError("The upload failed. Check your connection and try again."));
    });

    xhr.addEventListener("abort", () => {
      done();
      reject(new UploadError("Upload cancelled."));
    });

    xhr.send(form);
  });
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export async function uploadFile(
  file: File,
  kind: UploadKind,
  options: UploadOptions = {},
): Promise<UploadedFile> {
  const ticket = await requestTicket(kind);

  // Against the ticket, not UPLOAD_RULES, even though checkFile has usually run
  // already. The ticket is the server's current answer; the table compiled into
  // this bundle is whatever it said when the page was loaded, which an open tab
  // and a deploy that tightened a limit can disagree about.
  if (file.size > ticket.constraints.maxBytes) {
    throw new UploadError(
      `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(
        ticket.constraints.maxBytes,
      )}.`,
    );
  }

  if (file.type && !ticket.constraints.accept.includes(file.type)) {
    throw new UploadError(`${file.name} is not a file type we can accept.`);
  }

  return putToCloudinary(ticket, file, options.onProgress, options.signal);
}
