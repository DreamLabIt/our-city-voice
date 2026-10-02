# Multi-stage build. Stages are selected with `target:` in the compose files:
#   target: development  -> source mounted from the host, tsx watch, all deps
#   target: production   -> compiled dist/, production deps only, non-root
#
# The stages share the `base` layer, so Docker builds the common parts once.

# NOTE: no `--mount=type=cache` on the install steps. That is a BuildKit-only
# feature, and `docker compose build` silently falls back to the classic
# builder when the docker-buildx plugin is absent. Staying portable matters
# more here than the cache, and layer caching already covers the common case.
#
# If you install buildx (Arch/CachyOS: `sudo pacman -S docker-buildx`), you can
# speed installs up by changing the two `RUN pnpm install` lines to:
#   RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install ...

ARG NODE_VERSION=24-slim

# ── base ────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS base

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# corepack reads "packageManager" from package.json and installs that exact
# pnpm version, so the container and your host never disagree.
RUN corepack enable

WORKDIR /app

# ── deps: every dependency, including dev ───────────────────────────
FROM base AS deps

# Only the manifests, so this layer is cached until a dependency changes.
# Copying the whole source here would invalidate it on every code edit.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# ── development ─────────────────────────────────────────────────────
FROM base AS development

ENV NODE_ENV=development

# --chown matters here. COPY runs as root, and the compose file mounts named
# volumes over node_modules (and .next). Docker seeds a named volume from the
# image path, ownership included, so a root-owned directory in the image
# becomes a volume the `node` user cannot write to.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# uid 1000, which matches a typical Linux desktop user, so files written
# through the bind mount are not owned by root on the host.
USER node

EXPOSE 4000
CMD ["pnpm", "dev"]

# ── build ───────────────────────────────────────────────────────────
FROM deps AS build

COPY . .

# `pnpm build` is `prisma generate && tsc`. Generate needs no database: it only
# reads prisma/schema.prisma, and prisma.config.ts skips the datasource when
# DATABASE_URL is absent. The generated client lands in src/generated and tsc
# compiles it into dist/ alongside everything else, which is the whole reason
# the schema uses the `prisma-client` generator instead of `prisma-client-js`.
# A client generated into node_modules would be discarded by the prod-deps
# stage below.
RUN pnpm build

# ── prod-deps: runtime dependencies only ────────────────────────────
FROM base AS prod-deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod

# ── production ──────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build     /app/dist         ./dist
COPY package.json ./

# The migration SQL ships with the image so `prisma migrate deploy` can run
# against production from the same artefact that is being deployed.
COPY prisma/migrations ./prisma/migrations
COPY prisma/schema.prisma ./prisma/schema.prisma

USER node

EXPOSE 4000

# node:slim has no curl, but Node 24 has global fetch, so the probe needs
# no extra packages in the image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/index.js"]

# ── known issue: production image size ──────────────────────────────
#
# This image is around 825MB, of which roughly 160MB is Prisma tooling that
# the running server never touches: the CLI, Prisma Studio, pglite and a
# TypeScript compiler.
#
# The cause is that @prisma/client declares `prisma` and `typescript` as
# optional peer dependencies. Because the CLI is also a devDependency here,
# pnpm resolves those peer links and bakes them into the lockfile, so even
# `pnpm install --prod` reproduces them. Neither `ignoredOptionalDependencies`
# nor stripping devDependencies before installing changes that, because the
# lockfile already pins the peer-resolved variant of the package.
#
# Deliberately not "fixed" by rm -rf'ing those directories in this stage.
# Pruning a dependency graph by hand works until a runtime path needs
# something that looked unused, and that failure appears in production rather
# than at build time. A fat image is a worse trade than a broken one only in
# theory.
#
# Worth revisiting when: Prisma changes the peer setup, or the deploy is slow
# enough that the pull time actually hurts.
