import { z } from "zod";

import { env } from "../config/env.js";

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

export function mediaUrl(storageKey: string): string {
  if (/^https?:\/\//i.test(storageKey) || storageKey.startsWith("/")) {
    return storageKey;
  }

  const base = env.MEDIA_BASE_URL.replace(/\/$/, "");
  return base ? `${base}/${storageKey.replace(/^\//, "")}` : storageKey;
}