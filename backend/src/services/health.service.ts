import { pool } from "../db/pool.js";
import { env } from "../config/env.js";

export interface DependencyCheck {
  status: "ok" | "error";
  latencyMs: number;
  message?: string;
}

export interface LivenessReport {
  status: "ok";
  service: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
}

export interface ReadinessReport {
  status: "ok" | "degraded";
  timestamp: string;
  checks: {
    database: DependencyCheck;
  };
}

const SERVICE_NAME = "ourcityvoice-api";

export function getLiveness(): LivenessReport {
  return {
    status: "ok",
    service: SERVICE_NAME,
    environment: env.NODE_ENV,
    uptimeSeconds: Math.round(process.uptime() * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

async function checkDatabase(): Promise<DependencyCheck> {
  const startedAt = performance.now();
  try {
    await pool.query("SELECT 1");
    return {
      status: "ok",
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
    };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Math.round((performance.now() - startedAt) * 100) / 100,
      message: error instanceof Error ? error.message : "unknown database error",
    };
  }
}

export async function getReadiness(): Promise<ReadinessReport> {
  const database = await checkDatabase();

  return {
    status: database.status === "ok" ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    checks: { database },
  };
}