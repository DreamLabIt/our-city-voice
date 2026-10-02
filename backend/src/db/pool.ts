import pg from "pg";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const { Pool } = pg;

/**
 * A raw `pg` pool, used for infrastructure concerns: the readiness probe,
 * migrations, and anything that should not pay for an ORM.
 *
 * Application queries will go through Prisma once the schema exists. Keeping
 * the health check on `pg` is deliberate: a probe should test the database,
 * not your query builder.
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

/**
 * Without this handler, a dropped connection on an idle pooled client raises
 * an unhandled 'error' event and takes the whole process down. This is the
 * single most common way a Node + Postgres service dies at 3am.
 */
pool.on("error", (error) => {
  logger.error({ err: error }, "idle postgres client errored");
});

let closed = false;

/**
 * Idempotent. The Prisma adapter wraps this same pool, so $disconnect may
 * already have ended it; calling pool.end() twice throws.
 */
export async function closePool(): Promise<void> {
  if (closed) return;
  closed = true;
  try {
    await pool.end();
  } catch (error) {
    logger.warn({ err: error }, "pg pool was already closed");
  }
}
