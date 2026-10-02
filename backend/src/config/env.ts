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

  /** How long to let in-flight requests finish before forcing exit. */
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
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
} as const;

export type Env = typeof env;
