import { z } from "zod";

/**
 * Every environment variable the app reads is declared here, and nowhere else.
 *
 * The point of parsing at boot is that a missing or malformed variable kills
 * the process immediately with a readable message, instead of surfacing as a
 * confusing failure on the third request after a deploy.
 *
 * Rule: no `process.env` access anywhere outside this file.
 */
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  PORT: z.coerce.number().int().min(1).max(65535).default(4000),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine(
      (value) => value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a postgres:// or postgresql:// connection string",
    ),

  /** Comma separated list of browser origins allowed to call the API. */
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  // ── auth ──
  //
  // No default. A signing key with a fallback value is a signing key that
  // ships to production as the fallback value, and then anybody who has read
  // the repository can mint an access token for any account.
  //
  // 32 bytes is the HMAC-SHA256 block floor: a shorter key reduces the work an
  // attacker needs without reducing the work we do.
  //
  //   openssl rand -base64 48
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters; generate one with: openssl rand -base64 48"),

  /**
   * Access token lifetime. Short on purpose: it is a bearer token, it is not
   * checked against the database on each request, so revoking an account
   * cannot take effect until it expires. This is the length of that window.
   */
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().max(1440).default(15),

  /**
   * Refresh token lifetime, which is how long "stay signed in" actually lasts.
   * These are opaque, stored hashed, revocable, and rotated on every use.
   */
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),

  /** How long to let in-flight requests finish before forcing exit. */
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),

  /**
   * Hosts an uploaded media URL is allowed to point at, comma separated.
   *
   * Avatar and media URLs arrive in a request body, and the frontend renders
   * them in an img tag. Without this, any caller could store a URL on a host
   * they control and have it served to other users from inside our pages.
   * Uploads go straight to Cloudinary, so this is the only host it needs.
   */
  ALLOWED_MEDIA_HOSTS: z.string().default("res.cloudinary.com"),

  /**
   * Prefix for a media row's storage_key when that key is not already a URL.
   *
   * media.storage_key holds a bucket key, so the URL is built at read time and
   * the bucket or CDN in front of it can change without rewriting every row.
   * Two kinds of value never get a prefix: an absolute URL, and a root-relative
   * path, which is what the seed fixtures hold so the frontend's own files in
   * public/ render without an upload ever happening. Empty default, because in
   * development everything is one of those two.
   */
  MEDIA_BASE_URL: z.string().default(""),

  /**
   * Failed sign-in attempts allowed per IP per window, before the endpoint
   * starts answering 429. Generous enough that a person mistyping their
   * password never notices, tight enough that guessing is not free.
   */
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60_000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // The logger depends on env, so this one place has to use console.
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`,
  );
  console.error(
    [
      "",
      "Invalid environment configuration:",
      ...lines,
      "",
      "Copy backend/.env.example to backend/.env (or the project root .env",
      "if you are running through docker compose) and fill in the gaps.",
      "",
    ].join("\n"),
  );
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  isDevelopment: raw.NODE_ENV === "development",
  isTest: raw.NODE_ENV === "test",
  corsOrigins: raw.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean),
  allowedMediaHosts: raw.ALLOWED_MEDIA_HOSTS.split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
} as const;

export type Env = typeof env;
