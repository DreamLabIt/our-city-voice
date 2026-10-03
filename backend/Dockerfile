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

# This stage runs with your source bind mounted at /app, so the user inside
# the container has to be able to read and write files owned by you on the
# host. Linux bind mounts pass raw numeric uids straight through: there is no
# translating layer, so a container user of 1000 and a host user of 1001 are
# different people as far as the kernel is concerned, and your source is
# simply unreadable. It surfaces as the server dying on startup with
# `EACCES: permission denied, open '/app/package.json'`.
#
# So the host's ids arrive as build arguments and the image's `node` user is
# remapped to match. ./dev.sh fills them in from `id -u` and `id -g`.
#
# -o allows an id that something in the image already holds. gid 20 is
# `dialout` on debian and `staff` on macOS, so the macOS default of 501:20
# would fail to build without it.
#
# The 1000:1000 default keeps a bare `docker compose build` working. The
# production stage below deliberately remaps nothing: it owns its files at
# build time and bind mounts nothing, so there is no host user to agree with,
# and a production image that varied by who built it would be worse than one
# that is always the same.
# ARG UID=1000
# ARG GID=1000

# RUN groupmod -o -g "${GID}" node \
#  && usermod  -o -u "${UID}" -g "${GID}" node \
#  && chown -R "${UID}:${GID}" /home/node \
#  && chown "${UID}:${GID}" /app

# --chown matters here. COPY runs as root, and the compose file mounts a named
# volume over node_modules. Docker seeds a named volume from the image path,
# ownership included, so a root-owned directory in the image becomes a volume
# the container user cannot write to.
COPY --from=deps /app/node_modules ./node_modules

# Resolves through /etc/passwd, which the remap above rewrote, so this is
# whatever UID was passed in. When UID is 0 it is root, which is what rootless
# docker needs.
# USER node

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

# USER node

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
