import { createHash, randomBytes } from "node:crypto";

const TOKEN_BYTES = 32;

export interface NewRefreshToken {
  
  token: string;
  
  tokenHash: string;
}

export function createRefreshToken(): NewRefreshToken {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}