# Next.js in Docker. The production stage uses `output: "standalone"` from
# next.config.ts, which traces exactly the files the server needs and emits a
# self-contained server.js. Without it you would have to ship all of
# node_modules and the image is several times larger.

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

RUN corepack enable
WORKDIR /app

# ── deps ────────────────────────────────────────────────────────────
FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

# ── development ─────────────────────────────────────────────────────
FROM base AS development

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

# The host's ids, so the user inside the container is the same person who owns
# the bind mounted source. Without this the container cannot read your files
# whenever your host uid is not 1000. The reasoning is written out once, in
# the dev stage of backend/Dockerfile.
ARG UID=1000
ARG GID=1000

RUN groupmod -o -g "${GID}" node \
 && usermod  -o -u "${UID}" -g "${GID}" node \
 && chown -R "${UID}:${GID}" /home/node

# --chown matters here. COPY runs as root, and the compose file mounts named
# volumes over node_modules and .next. Docker seeds a named volume from the
# image path, ownership included, so a root-owned directory in the image
# becomes a volume the container user cannot write to.
COPY --from=deps --chown=${UID}:${GID} /app/node_modules ./node_modules
COPY --chown=${UID}:${GID} . .

# .next does not exist in the image, so without this the named volume mounted
# over it is created root-owned and the dev server cannot write its build.
RUN mkdir -p /app/.next && chown "${UID}:${GID}" /app/.next /app

USER node

EXPOSE 3000
CMD ["pnpm", "dev"]

# ── build ───────────────────────────────────────────────────────────
FROM deps AS build

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC_* values are inlined into the client bundle at build time, not
# read at runtime. That means the API URL has to be a build argument, and
# changing it requires rebuilding the image.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY . .
RUN pnpm build

# ── production ──────────────────────────────────────────────────────
FROM base AS production

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# standalone output is already pruned, so no pnpm install here.
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static     ./.next/static
COPY --from=build /app/public           ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
