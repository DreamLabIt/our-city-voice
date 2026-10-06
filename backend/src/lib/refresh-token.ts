import { createHash, randomBytes } from "node:crypto";

/**
 * Opaque refresh tokens.
 *
 * Deliberately not a JWT. A refresh token's whole job is to be revocable, and
 * a self-contained signed token cannot be revoked without a database lookup
 * anyway, so the JWT buys nothing and costs the ability to mean "this exact
 * token, once". A random string checked against a row does the job.
 *
 * Only the sha256 is stored. Dumping refresh_tokens then gives an attacker
 * hashes, not sessions. No salt and no KDF here, unlike password.ts: these are
 * 256 bits of CSPRNG output, so there is no dictionary to run and nothing for
 * a slow hash to protect against.
 */

const TOKEN_BYTES = 32;

export interface NewRefreshToken {
  /** Goes to the client. Never stored. */
  token: string;
  /** Goes in the database. Never leaves it. */
  tokenHash: string;
}

export function createRefreshToken(): NewRefreshToken {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
