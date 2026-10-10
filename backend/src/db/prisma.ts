import "../lib/serialize.js";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { pool } from "./pool.js";

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: env.isDevelopment
    ? [
        { emit: "event", level: "query" },
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ]
    : [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ],
});

if (env.isDevelopment) {
  prisma.$on("query", (event) => {
    logger.debug({ query: event.query, params: event.params, durationMs: event.duration }, "prisma query");
  });
}

prisma.$on("warn", (event) => logger.warn({ target: event.target }, event.message));
prisma.$on("error", (event) => logger.error({ target: event.target }, event.message));

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}