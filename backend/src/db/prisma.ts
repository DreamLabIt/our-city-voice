// Side-effect import, deliberately here rather than in app.ts: every id in
// this schema is a BigInt, and JSON.stringify throws on those. Putting it with
// the client means anything that queries gets working serialisation, including
// scripts and tests that never build an Express app.
import "../lib/serialize.js";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { pool } from "./pool.js";

/**
 * The Prisma client, for application queries.
 *
 * Prisma 7 connects through a driver adapter rather than its own Rust-managed
 * connection pool, which lets us hand it the `pg` pool that already exists in
 * pool.ts. One pool for the whole process, one place to tune `max`, and the
 * readiness probe measures the same connections the app actually uses.
 *
 * Division of labour:
 *   prisma  application queries, relations, transactions
 *   pool    the readiness probe and anything that should not pay for an ORM
 */
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
    // Seeing the generated SQL is the fastest way to learn what an ORM call
    // actually costs. Set LOG_LEVEL=info to silence this.
    logger.debug({ query: event.query, params: event.params, durationMs: event.duration }, "prisma query");
  });
}

prisma.$on("warn", (event) => logger.warn({ target: event.target }, event.message));
prisma.$on("error", (event) => logger.error({ target: event.target }, event.message));

/**
 * Closing the Prisma client also ends the shared pg pool, so index.ts calls
 * this instead of closePool() to avoid ending the same pool twice.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
