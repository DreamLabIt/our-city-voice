import { NextResponse } from "next/server";

import { CloudinaryNotConfiguredError, createUploadTicket } from "@/lib/cloudinary";
import { clientKey, consume } from "@/lib/rate-limit";
import { getCurrentUser } from "@/lib/session";
import { UPLOAD_RULES } from "@/lib/upload-rules";
import type { UploadKind } from "@/types";

/**
 * POST /api/uploads/signature   { "kind": "avatar" | "report-media" }
 *
 * Hands the browser a short-lived, scoped permission to upload one file to
 * Cloudinary. The API secret stays on this server.
 *
 * The caller chooses a kind, never a folder, a format list or a size. Those come
 * from UPLOAD_RULES and go into the signature, so the only thing a client can
 * decide is which of two fixed shapes it wants.
 */

/** Generous for a person filling in a form, pointless for a script. */
const MAX_SIGNATURES = 30;
const WINDOW_MS = 10 * 60_000;

function isUploadKind(value: unknown): value is UploadKind {
  return typeof value === "string" && value in UPLOAD_RULES;
}

export async function POST(request: Request): Promise<NextResponse> {
  const limit = consume(`signature:${clientKey(request)}`, MAX_SIGNATURES, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: { code: "TOO_MANY_REQUESTS", message: "Too many uploads. Please wait a moment." } },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const kind = (body as { kind?: unknown }).kind;
  if (!isUploadKind(kind)) {
    return NextResponse.json(
      {
        error: {
          code: "BAD_REQUEST",
          message: `kind must be one of: ${Object.keys(UPLOAD_RULES).join(", ")}`,
        },
      },
      { status: 400 },
    );
  }

  // Avatars are uploaded during registration, so that kind is reachable without
  // a session by necessity. Everything else is not.
  if (UPLOAD_RULES[kind].requiresSession) {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Please sign in to upload." } },
        { status: 401 },
      );
    }
  }

  try {
    return NextResponse.json(createUploadTicket(kind));
  } catch (error) {
    if (error instanceof CloudinaryNotConfiguredError) {
      // The variables are missing from .env. A 503 with the real reason, because
      // this is a deployment problem the person running it needs to see, not a
      // client mistake.
      console.error(`[uploads] ${error.message}`);
      return NextResponse.json(
        {
          error: {
            code: "UPLOADS_NOT_CONFIGURED",
            message: "File uploads are not set up on this server yet.",
          },
        },
        { status: 503 },
      );
    }
    throw error;
  }
}
