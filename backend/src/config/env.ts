import { z } from "zod";

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

  
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters; generate one with: openssl rand -base64 48"),

  
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().int().positive().max(1440).default(15),

  
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(365).default(30),

  
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),

  
  ALLOWED_MEDIA_HOSTS: z.string().default("res.cloudinary.com"),

  
  MEDIA_BASE_URL: z.string().default(""),

  
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60_000),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
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