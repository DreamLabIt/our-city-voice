import pino from "pino";

import { env } from "../config/env.js";

/**
 * One logger for the whole process.
 *
 * In development it pipes through pino-pretty so lines are readable. In
 * production it emits newline-delimited JSON, which is what log collectors
 * expect and what lets you grep by `reqId` across a whole request.
 *
 * Never use console.log in application code. Once two requests overlap,
 * unstructured output stops being traceable.
 */
export const logger = pino({
  level: env.LOG_LEVEL,

  // Strip anything that should never reach a log file or a log vendor.
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "res.headers['set-cookie']",
      "*.password",
      "*.password_hash",
      "*.token",
      "*.token_hash",
    ],
    censor: "[redacted]",
  },

  ...(env.isProduction
    ? {}
    : {
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss.l",
            ignore: "pid,hostname",
          },
        },
      }),
});

export type Logger = typeof logger;
