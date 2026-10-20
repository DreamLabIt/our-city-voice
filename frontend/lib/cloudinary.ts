import { createHash } from "node:crypto";
import { UPLOAD_RULES } from "@/lib/upload-rules";
import type { UploadKind } from "@/types";

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
    rootFolder:
      process.env.CLOUDINARY_FOLDER?.replace(/^\/+|\/+$/g, "") ||
      "ourcityvoice",
  };
}

function signParams(params: Record<string, string>, apiSecret: string): string {
  const canonical = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

export interface UploadTicket {
  uploadUrl: string;
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

export async function deleteCloudinaryAsset(publicId: string): Promise<boolean> {
  try {
    const config = readConfig();
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signed: Record<string, string> = {
      public_id: publicId,
      timestamp,
    };

    const signature = signParams(signed, config.apiSecret);

    const formData = new URLSearchParams();
    formData.append("public_id", publicId);
    formData.append("api_key", config.apiKey);
    formData.append("timestamp", timestamp);
    formData.append("signature", signature);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/destroy`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    return data.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete failed:", error);
    return false;
  }
}