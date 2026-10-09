import type { ErrorRequestHandler, RequestHandler } from "express";

import { env } from "../config/env.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`No route for ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
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
      message: isKnown ? error.message : "Internal server error",
      ...(isKnown && error.details !== undefined ? { details: error.details } : {}),
      requestId,
      ...(env.isProduction || !(error instanceof Error)
        ? {}
        : { stack: error.stack }),
    },
  });
};