/**
 * Regenerates prisma/seed-data/mock-data.json from the frontend's fixtures.
 *
 *   pnpm seed:extract
 *
 * Why a JSON file in between, instead of the seed importing mock-data.ts
 * directly: the backend's Docker build context is backend/ only, so a relative
 * import reaching up into frontend/ would compile on your laptop and fail in
 * the container. A committed JSON snapshot keeps the backend self-contained.
 *
 * Re-run this whenever frontend/data/mock-data.ts changes, then ./dev.sh seed.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const mockDataPath = resolve(here, "../../frontend/data/mock-data.ts");

/** The exports the seed consumes. Everything else is presentation. */
const WANTED = [
  "categories",
  "posts",
  "postComments",
  "initialReports",
  "reportCategories",
  "reportStatuses",
  "reportWards",
] as const;

/**
 * lucide icons are React components. The database stores the icon's name, so
 * a component collapses to its string name and everything else recurses.
 */
function strip(value: unknown): unknown {
  if (typeof value === "function") {
    const fn = value as { displayName?: string; name?: string };
    return fn.displayName ?? fn.name ?? null;
  }
  if (value && typeof value === "object") {
    if ("$$typeof" in value) {
      const component = value as { displayName?: string; name?: string };
      return component.displayName ?? component.name ?? null;
    }
    if (Array.isArray(value)) return value.map(strip);
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, strip(v)]),
    );
  }
  return value;
}

async function main(): Promise<void> {
  const mod = (await import(mockDataPath)) as Record<string, unknown>;

  const out: Record<string, unknown> = {};
  for (const key of WANTED) {
    if (!(key in mod)) {
      console.warn(`  warning: ${key} is no longer exported from mock-data.ts`);
      continue;
    }
    out[key] = strip(mod[key]);
  }

  const target = join(here, "seed-data", "mock-data.json");
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(out, null, 2)}\n`);

  console.log(`wrote ${target}`);
  for (const [key, value] of Object.entries(out)) {
    console.log(`  ${key.padEnd(18)} ${Array.isArray(value) ? value.length : 1}`);
  }
}

main().catch((error: unknown) => {
  console.error("extraction failed:", error);
  process.exitCode = 1;
});
