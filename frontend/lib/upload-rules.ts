import type { UploadKind } from "@/types";

/**
 * What each kind of upload is allowed to be.
 *
 * Split out of lib/cloudinary.ts so the browser can read it too. That file
 * imports node:crypto to sign, which makes it unimportable from a client
 * component, and the size and format limits are now needed in two places:
 *
 *   - in the browser, to refuse a 60MB video the moment it is chosen. Uploading
 *     happens on submit, so without a check here the file would sit in the list
 *     looking accepted and fail much later
 *   - in the signature, so Cloudinary enforces the same limits on a caller that
 *     never ran our check
 */

export interface KindRules {
  /** Appended to CLOUDINARY_FOLDER, so everything stays under one root. */
  subfolder: string;
  /** image, or auto when the kind accepts both images and video. */
  resourceType: "image" | "auto";
  /** Signed, and enforced by Cloudinary rather than by us. */
  allowedFormats: string[];
  /** Checked in the browser before uploading, for a useful message. */
  maxBytes: number;
  /** For the file input's accept attribute and the pre-upload check. */
  accept: string[];
  /** Whether a signed-in account is required to ask for a signature. */
  requiresSession: boolean;
}

const MB = 1024 * 1024;

export const UPLOAD_RULES: Record<UploadKind, KindRules> = {
  // Requested during registration, before any account exists, so this one
  // cannot require a session. It is the looser of the two for that reason:
  // small, images only.
  avatar: {
    subfolder: "avatars",
    resourceType: "image",
    allowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
    maxBytes: 5 * MB,
    accept: ["image/jpeg", "image/png", "image/webp", "image/avif"],
    requiresSession: false,
  },
  "report-media": {
    subfolder: "reports",
    resourceType: "auto",
    allowedFormats: ["jpg", "jpeg", "png", "webp", "avif", "mp4", "webm", "mov"],
    maxBytes: 50 * MB,
    accept: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ],
    requiresSession: true,
  },
};
