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

USER node

EXPOSE 4000

# node:slim has no curl, but Node 24 has global fetch, so the probe needs
# no extra packages in the image.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:4000/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "dist/index.js"]
