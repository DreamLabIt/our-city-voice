import compression from "compression";
import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { randomUUID } from "node:crypto";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { apiRouter } from "./routes/index.js";

const API_PREFIX = "/api/v1";

/**
 * Builds the Express app without starting a server.
 *
 * Keeping `listen` out of here is what lets tests run the whole app in-process
 * with supertest, and it keeps the startup sequence in one readable place.
 */
export function createApp(): Express {
  const app = express();

  // Behind nginx, req.ip must come from X-Forwarded-For or every client IP in
  // your logs and rate limiter is the proxy container's IP.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header: curl, server-to-server, same-origin navigation.
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalised = origin.replace(/\/$/, "");
        if (env.corsOrigins.includes(normalised)) {
          callback(null, true);
          return;
        }

        // Vercel mints a fresh URL per preview deploy, so an exact allowlist
        // cannot cover them. Allowed outside production only.
        if (!env.isProduction && /^https:\/\/[\w-]+\.vercel\.app$/.test(normalised)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers["x-request-id"];
        const id = (Array.isArray(existing) ? existing[0] : existing) ?? randomUUID();
        res.setHeader("x-request-id", id);
        return id;
      },
      // The docker healthcheck hits /health every 10s forever. Logging it
      // buries everything you actually want to read.
      autoLogging: {
        ignore: (req) => req.url?.startsWith(`${API_PREFIX}/health`) ?? false,
      },
    }),
  );

  app.use(API_PREFIX, apiRouter);

  // Order matters: 404 first, then the error handler, both after all routes.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
