import { defineConfig } from "prisma/config";

/**
 * Configuration for the Prisma CLI: generate, migrate, db, studio.
 *
 * Prisma 7 moved the connection URL out of schema.prisma and into this file.
 * The split is deliberate: the CLI needs a privileged connection, since
 * `migrate dev` creates and drops a shadow database to diff against, while the
 * running application connects through a driver adapter. See src/db/prisma.ts.
 *
 * Loaded by the CLI only. Never bundled into the server.
 */

// Read through process.env rather than Prisma's env() helper, which throws the
// moment the variable is missing. That eager throw breaks `prisma generate`
// inside the Docker build, where no database exists yet and none is needed:
// generating a client only reads the schema file.
//
// Commands that genuinely need a connection still fail, just with Prisma's own
// message about a missing datasource rather than a config load error.
const url = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",

  ...(url ? { datasource: { url } } : {}),

  migrations: {
    // What `prisma db seed` runs. tsx is already a dependency for the dev
    // server, so the seed needs no separate build step.
    seed: "tsx prisma/seed.ts",
  },
});
