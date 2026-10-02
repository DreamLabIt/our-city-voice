import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

/** Anything that reached the end of the router matched no route. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`No route for ${req.method} ${req.originalUrl}`));
};

/**
 * The single place an error becomes a response.
 *
 * Express 5 forwards rejected promises from async handlers here automatically,
 * so route handlers do not need try/catch just to pass errors along.
 */
export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
  // Headers already flushed, so the only correct move is to abort the stream.
  if (res.headersSent) {
    next(error);
    return;
  }

  const isKnown = error instanceof AppError;
  const statusCode = isKnown ? error.statusCode : 500;
  const requestId = req.id ?? null;

  const log = req.log ?? logger;
  if (statusCode >= 500) {
    log.error({ err: error, requestId }, "request failed");
  } else {
    log.warn(
      { code: isKnown ? error.code : "UNKNOWN", statusCode, requestId },
      error instanceof Error ? error.message : "request rejected",
    );
  }

  res.status(statusCode).json({
    error: {
      code: isKnown ? error.code : "INTERNAL_SERVER_ERROR",
      // An unexpected error's message can contain table names, file paths or
      // connection strings. Clients get a fixed string instead.
      message: isKnown ? error.message : "Internal server error",
      ...(isKnown && error.details !== undefined ? { details: error.details } : {}),
      requestId,
      // Stacks are a development convenience only.
      ...(env.isProduction || !(error instanceof Error)
        ? {}
        : { stack: error.stack }),
    },
  });
};
