import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import type { ScryptOptions } from "node:crypto";
import { promisify } from "node:util";

// promisify picks scrypt's 3-argument overload and drops the one that takes
// options, so the cost parameters below would be a type error without this
// explicit signature.
const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from node's standard library.
 *
 * No dependency on bcrypt or argon2 on purpose. scrypt is a memory-hard KDF
 * designed for exactly this, it is in Node core, and skipping a native module
 * keeps the Docker image free of a build toolchain.
 *
 * Stored format:  scrypt$N$r$p$<salt base64>$<hash base64>
 *
 * The parameters are part of the string rather than a constant in the code,
 * so raising the cost later does not invalidate existing hashes: old ones keep
 * verifying with the parameters they were created with.
 */

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

// cost=16384 is node's default and the usual interactive-login setting.
// Memory used is roughly 128 * N * r bytes, so about 16MB here.
const PARAMS = { N: 16_384, r: 8, p: 1 } as const;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password, salt, KEY_LENGTH, {
    N: PARAMS.N,
    r: PARAMS.r,
    p: PARAMS.p,
    // scrypt needs maxmem above 128*N*r or node refuses to run it.
    maxmem: 256 * PARAMS.N * PARAMS.r,
  });

  return [
    "scrypt",
    PARAMS.N,
    PARAMS.r,
    PARAMS.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const [, rawN, rawR, rawP, rawSalt, rawHash] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const salt = Buffer.from(rawSalt ?? "", "base64");
  const expected = Buffer.from(rawHash ?? "", "base64");

  const derived = await scrypt(password, salt, expected.length, {
    N,
    r,
    p,
    maxmem: 256 * N * r,
  });

  // Constant time. A plain === leaks how many leading bytes matched, which is
  // enough to recover a hash one byte at a time given enough attempts.
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
