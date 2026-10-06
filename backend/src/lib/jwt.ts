import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";
import type { UserRole } from "../generated/prisma/enums.js";

/**
 * HS256 access tokens, signed with node's crypto.
 *
 * No jsonwebtoken, no jose, for the same reason password.ts has no bcrypt: the
 * whole of HMAC-SHA256 is in Node core and a signed JSON blob is not much code.
 *
 * Hand-rolled JWT has a well known family of holes, so each one is closed here
 * on purpose and the comments say which:
 *
 *   alg confusion   verify() never reads an algorithm out of the token and
 *                   dispatches on it. It computes an HS256 MAC and compares.
 *                   A token claiming alg:none or alg:RS256 fails the compare,
 *                   and the header check below rejects it before that anyway.
 *   signature leak  timingSafeEqual, not ===. See the note in password.ts.
 *   missing expiry  exp is required, not optional. A token without one is
 *                   rejected rather than treated as eternal.
 *   wrong audience  iss and aud are checked, so a token minted by some other
 *                   service that happens to share the secret will not pass.
 *
 * What this is not: it is not a general JWT library. It verifies tokens this
 * process signed, with one algorithm and one key. Do not hand it third-party
 * tokens.
 */

const ALGORITHM = "HS256";
const TYPE = "JWT";
const ISSUER = "ourcityvoice";
const AUDIENCE = "ourcityvoice-api";

/** Tolerance for the two machines' clocks disagreeing. */
const CLOCK_SKEW_SECONDS = 30;

export interface AccessTokenClaims {
  /** The user id, as a string. BigInt ids do not survive JSON. */
  sub: string;
  role: UserRole;
  /** Unique per token, so a specific token could be denylisted if ever needed. */
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

/** The header is fixed, so it is computed once rather than per token. */
const HEADER_SEGMENT = encode({ alg: ALGORITHM, typ: TYPE });

export interface AccessTokenResult {
  token: string;
  /** When it stops working, for the caller to pass on to a cookie max-age. */
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

/**
 * Throws InvalidTokenError on anything that is not a token this process signed
 * and that is still inside its validity window. The caller turns that into a
 * 401; the reason is for logs, never for the response body, since telling a
 * client *why* its forged token failed is free help.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
  const parts = token.split(".");
  if (parts.length !== 3) throw new InvalidTokenError("expected three segments");

  const [header, payload, signature] = parts as [string, string, string];

  const expected = Buffer.from(sign(`${header}.${payload}`), "utf8");
  const provided = Buffer.from(signature, "utf8");
  // Length has to match before timingSafeEqual, which throws on a mismatch
  // rather than returning false. Lengths are public information here: the MAC
  // is always the same size, so a wrong length is already a failed token.
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
  // A token issued in the future means a clock problem or a forged iat. Either
  // way it is not something to accept.
  if (claims.iat - CLOCK_SKEW_SECONDS > now) throw new InvalidTokenError("issued in the future");

  return claims as AccessTokenClaims;
}
