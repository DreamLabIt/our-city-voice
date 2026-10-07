import { z } from "zod";

import { env } from "../config/env.js";

/**
 * A URL pointing at an upload we accept.
 *
 * Uploads go from the browser straight to Cloudinary, so the API never sees the
 * file; it is handed the resulting URL. That makes the URL untrusted input, and
 * the field it lands in gets rendered in an img tag on pages other people read.
 *
 * Two checks, both necessary:
 *   https only   an http URL on an https page is blocked as mixed content, so
 *                the avatar silently fails to load
 *   host         without it, "avatarUrl" is a free slot for pointing our pages
 *                at any host on the internet, including a tracking pixel that
 *                collects the IP of everybody who views the profile
 */
export const mediaUrlSchema = z
  .url("Upload URL is not valid")
  .max(2048, "Upload URL is too long")
  .refine((value) => {
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      return false;
    }

    return url.protocol === "https:" && env.allowedMediaHosts.includes(url.hostname.toLowerCase());
  }, `Uploads must be hosted on: ${env.allowedMediaHosts.join(", ")}`);

/**
 * The URL for a media row, built from its storage key at read time.
 *
 * Three cases, because the column holds three kinds of value today:
 *
 *   absolute URL     a Cloudinary secure_url, or a fixture pointing at an
 *                    external video. Returned untouched
 *   root-relative    "/road_surface.jpeg", which the seed fixtures use so the
 *                    frontend's own files in public/ render. Also untouched:
 *                    prefixing it would break the one case it exists for
 *   bucket key       anything else. Gets MEDIA_BASE_URL in front of it
 *
 * Not validated against allowedMediaHosts. That check guards what we accept
 * *into* the database; this reads what is already there, and silently dropping
 * a stored image because a host was removed from the allowlist would be worse
 * than serving it.
 */
export function mediaUrl(storageKey: string): string {
  if (/^https?:\/\//i.test(storageKey) || storageKey.startsWith("/")) {
    return storageKey;
  }

  const base = env.MEDIA_BASE_URL.replace(/\/$/, "");
  return base ? `${base}/${storageKey.replace(/^\//, "")}` : storageKey;
}
