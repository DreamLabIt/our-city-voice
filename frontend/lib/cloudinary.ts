import { createHash } from "node:crypto";

import { UPLOAD_RULES } from "@/lib/upload-rules";
import type { UploadKind } from "@/types";

/**
 * Signed direct uploads to Cloudinary.
 *
 * The browser sends the file straight to Cloudinary; this server only signs the
 * request. Two reasons that is the right shape here:
 *
 *   - a report can carry video. Routing a 40MB file through a Next.js server
 *     action means buffering it in our process and raising the body limit for
 *     every other action at the same time
 *   - an unsigned upload preset, which is the usual shortcut, is a public write
 *     credential. Anyone who reads the page source can upload to the account
 *     until it is turned off
 *
 * The signature covers the folder and the allowed formats, so a client cannot
 * move an upload somewhere else or widen what it may send without invalidating
 * it. Cloudinary also rejects a signature whose timestamp is more than an hour
 * old, so one cannot be hoarded.
 *
 * What a kind is allowed to be lives in lib/upload-rules.ts, which the browser
 * reads as well.
 */

interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  rootFolder: string;
}

export class CloudinaryNotConfiguredError extends Error {
  constructor(missing: string[]) {
    super(`Cloudinary is not configured. Missing: ${missing.join(", ")}`);
    this.name = "CloudinaryNotConfiguredError";
  }
}

/**
 * Read at call time, not at module load.
 *
 * Reading at module load would crash the whole app on boot when the keys are
 * absent, including every page that has nothing to do with uploading. This way
 * the uploader is the only thing that breaks, and it breaks with a message that
 * names the variable.
 */
function readConfig(): CloudinaryConfig {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  const missing = [
    ["CLOUDINARY_CLOUD_NAME", cloudName],
    ["CLOUDINARY_API_KEY", apiKey],
    ["CLOUDINARY_API_SECRET", apiSecret],
  ]
    .filter(([, value]) => !value || value === "CHANGE_ME")
    .map(([name]) => name as string);

  if (missing.length > 0 || !cloudName || !apiKey || !apiSecret) {
    throw new CloudinaryNotConfiguredError(missing);
  }

  return {
    cloudName,
    apiKey,
    apiSecret,
    rootFolder: process.env.CLOUDINARY_FOLDER?.replace(/^\/+|\/+$/g, "") || "ourcityvoice",
  };
}

/**
 * Cloudinary's scheme: sort the parameters by key, join them as a query string,
 * append the API secret, hash.
 *
 * Verified against the worked example in Cloudinary's "Generating authentication
 * signatures" page, which is the only way to be sure about the sorting and the
 * secret going on the end rather than the front.
 *
 * SHA-1 because it is what every Cloudinary SDK sends by default, so it is the
 * path guaranteed to be accepted. SHA-256 is also validated by default and would
 * be a one-line change here. Either is fine: this is a MAC over a handful of
 * short, server-chosen values with a secret suffix, and SHA-1's weakness is
 * collision resistance, which nothing here depends on.
 */
function signParams(params: Record<string, string>, apiSecret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

export interface UploadTicket {
  uploadUrl: string;
  /**
   * Appended to the FormData verbatim, alongside the file.
   *
   * An opaque bag on purpose: adding another signed parameter later is a change
   * here and nowhere else, because the client does not know what any of these
   * mean.
   */
  fields: Record<string, string>;
  constraints: {
    maxBytes: number;
    accept: string[];
    resourceType: "image" | "auto";
  };
}

export function createUploadTicket(kind: UploadKind): UploadTicket {
  const config = readConfig();
  const rules = UPLOAD_RULES[kind];

  // Seconds, not milliseconds. Cloudinary compares this against its own clock
  // and rejects anything over an hour old, which is what bounds how long a
  // handed-out signature stays usable.
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signed: Record<string, string> = {
    timestamp,
    folder: `${config.rootFolder}/${rules.subfolder}`,
    allowed_formats: rules.allowedFormats.join(","),
  };

  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${config.cloudName}/${rules.resourceType}/upload`,
    fields: {
      ...signed,
      // Not signed, and not secret. The API key identifies the account; the
      // signature is what authorises the upload.
      api_key: config.apiKey,
      signature: signParams(signed, config.apiSecret),
    },
    constraints: {
      maxBytes: rules.maxBytes,
      accept: rules.accept,
      resourceType: rules.resourceType,
    },
  };
}
