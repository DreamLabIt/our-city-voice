import pg from "pg";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
  logger.error({ err: error }, "idle postgres client errored");
});

let closed = false;

export async function closePool(): Promise<void> {
  if (closed) return;
  closed = true;
  try {
    await pool.end();
  } catch (error) {
    logger.warn({ err: error }, "pg pool was already closed");
  }
}