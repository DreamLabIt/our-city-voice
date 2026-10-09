import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";
import type { UserRole } from "../generated/prisma/enums.js";

const ALGORITHM = "HS256";
const TYPE = "JWT";
const ISSUER = "ourcityvoice";
const AUDIENCE = "ourcityvoice-api";

const CLOCK_SKEW_SECONDS = 30;

export interface AccessTokenClaims {
  
  sub: string;
  role: UserRole;
  
  jti: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export class InvalidTokenError extends Error {
  constructor(reason: string) {
    super(reason);
    this.name = "InvalidTokenError";
  }
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(signingInput: string): string {
  return createHmac("sha256", env.JWT_SECRET).update(signingInput).digest("base64url");
}

const HEADER_SEGMENT = encode({ alg: ALGORITHM, typ: TYPE });

export interface AccessTokenResult {
  token: string;
  
  expiresAt: Date;
}

export function signAccessToken(userId: bigint, role: UserRole): AccessTokenResult {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + env.ACCESS_TOKEN_TTL_MINUTES * 60;

  const claims: AccessTokenClaims = {
    sub: userId.toString(),
    role,
    jti: randomUUID(),
    iss: ISSUER,
    aud: AUDIENCE,
    iat: issuedAt,
    exp: expiresAt,
  };

  const signingInput = `${HEADER_SEGMENT}.${encode(claims)}`;

  return {
    token: `${signingInput}.${sign(signingInput)}`,
    expiresAt: new Date(expiresAt * 1000),
  };
}

function parseSegment(segment: string): unknown {
  try {
    return JSON.parse(Buffer.from(segment, "base64url").toString("utf8"));
  } catch {
    throw new InvalidTokenError("token segment is not valid base64url JSON");
  }
}

export function verifyAccessToken(token: string): AccessTokenClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new InvalidTokenError("expected three segments");

  const [header, payload, signature] = parts as [string, string, string];

  const expected = Buffer.from(sign(`${header}.${payload}`), "utf8");
  const provided = Buffer.from(signature, "utf8");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new InvalidTokenError("signature mismatch");
  }

  const head = parseSegment(header);
  if (
    typeof head !== "object" ||
    head === null ||
    (head as Record<string, unknown>).alg !== ALGORITHM ||
    (head as Record<string, unknown>).typ !== TYPE
  ) {
    throw new InvalidTokenError("unexpected header");
  }

  const claims = parseSegment(payload) as Partial<AccessTokenClaims>;
  if (typeof claims !== "object" || claims === null) {
    throw new InvalidTokenError("payload is not an object");
  }

  if (claims.iss !== ISSUER) throw new InvalidTokenError("wrong issuer");
  if (claims.aud !== AUDIENCE) throw new InvalidTokenError("wrong audience");
  if (typeof claims.sub !== "string" || claims.sub.length === 0) {
    throw new InvalidTokenError("missing subject");
  }
  if (typeof claims.role !== "string") throw new InvalidTokenError("missing role");
  if (typeof claims.exp !== "number" || typeof claims.iat !== "number") {
    throw new InvalidTokenError("missing iat or exp");
  }

  const now = Math.floor(Date.now() / 1000);
  if (claims.exp + CLOCK_SKEW_SECONDS < now) throw new InvalidTokenError("expired");
  if (claims.iat - CLOCK_SKEW_SECONDS > now) throw new InvalidTokenError("issued in the future");

  return claims as AccessTokenClaims;
}