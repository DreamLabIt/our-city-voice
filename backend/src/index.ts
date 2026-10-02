import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { closePool } from "./db/pool.js";
import { logger } from "./lib/logger.js";

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, env: env.NODE_ENV, corsOrigins: env.corsOrigins },
    `API listening on http://localhost:${env.PORT}/api/v1`,
  );
});

let shuttingDown = false;

/**
 * Graceful shutdown.
 *
 * `docker compose down` sends SIGTERM and then kills the container 10 seconds
 * later. Without this, in-flight requests are cut mid-response and pooled
 * Postgres connections are left for the server to time out.
 */
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ signal }, "shutting down");

  const forceExit = setTimeout(() => {
    logger.error("shutdown timed out, forcing exit");
    process.exit(1);
  }, env.SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await closePool();
    logger.info("shutdown complete");
    process.exit(0);
  } catch (error) {
    logger.error({ err: error }, "error during shutdown");
    process.exit(1);
  }
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));

// A promise rejected with no catch means a bug. Log it with a stack and exit,
// rather than letting the process limp along in an unknown state.
process.on("unhandledRejection", (reason) => {
  logger.fatal({ err: reason }, "unhandled promise rejection");
  void shutdown("SIGTERM");
});

process.on("uncaughtException", (error) => {
  logger.fatal({ err: error }, "uncaught exception");
  process.exit(1);
});
