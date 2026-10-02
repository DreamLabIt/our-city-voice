#!/usr/bin/env bash
#
# OurCityVoice development environment.
#
#   ./dev.sh            start everything and follow the logs
#   ./dev.sh help       every command
#
# This is a thin wrapper over docker compose. Everything it does, you could
# type by hand; it exists so you do not have to remember the flags.

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env"

# Records the uid:gid the dev images were last built with. See
# sync_container_user below for what it is for. Gitignored.
USER_STAMP=".dev-container-user"

# Colours, but only when stdout is a terminal (so piping to a file stays clean).
if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; BLUE=''; RESET=''
fi

info()  { printf '%s==>%s %s\n' "$BLUE$BOLD" "$RESET" "$*"; }
ok()    { printf '%s ok %s %s\n' "$GREEN$BOLD" "$RESET" "$*"; }
warn()  { printf '%s!!!%s %s\n' "$YELLOW$BOLD" "$RESET" "$*" >&2; }
die()   { printf '%serr%s %s\n' "$RED$BOLD" "$RESET" "$*" >&2; exit 1; }

dc() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

# ── container user ──────────────────────────────────────────────────
# The dev containers bind mount this repository, and a linux bind mount passes
# raw numeric uids through without translating them. So the user inside the
# container has to be the same number as the user who owns these files, or it
# cannot read them and the backend crash-loops on startup with
# `EACCES: permission denied, open '/app/package.json'`.
#
# The value is worked out per run rather than written into .env, because the
# right answer is a property of the machine and not of the project: a checkout
# copied to another box, or shared over NFS, should pick up the new host's ids
# by itself rather than carry the old host's in a committed-adjacent file.
resolve_container_user() {
  CONTAINER_USER_GUESSED=0

  # An explicit pair wins, for the cases this cannot work out by itself: a
  # checkout owned by a service account, or a docker context pointed at a
  # machine other than this one.
  #
  # .env is read as well as the environment. Exporting is what compose
  # actually consumes, and an exported value outranks --env-file, so without
  # this a value set in .env would be silently overridden by the guess below.
  local uid="${HOST_UID:-}" gid="${HOST_GID:-}"
  if [[ -f "$ENV_FILE" ]]; then
    uid="${uid:-$(env_value HOST_UID "")}"
    gid="${gid:-$(env_value HOST_GID "")}"
  fi

  if [[ -n "$uid" && -n "$gid" ]]; then
    HOST_UID="$uid"
    HOST_GID="$gid"
    CONTAINER_USER_NOTE="set explicitly"
    export HOST_UID HOST_GID
    return 0
  fi

  CONTAINER_USER_GUESSED=1

  # Rootless docker is the exception to matching your own uid. It maps the
  # container's root onto the host user who started the daemon, so the files
  # you own already appear root-owned inside the container, and matching your
  # real uid would break what currently works.
  if docker info --format '{{range .SecurityOptions}}{{println .}}{{end}}' 2>/dev/null |
    grep -qx 'name=rootless'; then
    HOST_UID=0
    HOST_GID=0
    CONTAINER_USER_NOTE="rootless docker, so root in the container is you on the host"
  else
    HOST_UID="$(id -u)"
    HOST_GID="$(id -g)"
    CONTAINER_USER_NOTE="your host user"
  fi
  export HOST_UID HOST_GID
}

# Matching the container user to *you* only helps if you actually own the
# source. A tree cloned under sudo, restored from a backup, or copied from
# another account is owned by somebody else and stays unreadable.
check_source_ownership() {
  # Only meaningful when the ids were guessed from your own account. An
  # explicit override, or rootless docker, is a deliberate mismatch.
  if [[ "$CONTAINER_USER_GUESSED" != "1" || "$HOST_UID" == "0" ]]; then
    return 0
  fi

  # -c is GNU stat, -f is BSD stat, for the same field.
  local owner
  owner="$(stat -c '%u' backend/package.json 2>/dev/null ||
    stat -f '%u' backend/package.json 2>/dev/null || echo "$HOST_UID")"
  if [[ "$owner" == "$HOST_UID" ]]; then
    return 0
  fi

  warn "backend/package.json is owned by uid $owner, but you are $HOST_UID."
  warn "The containers run as you, so they will not be able to read it. Fix with:"
  warn "  sudo chown -R $HOST_UID:$HOST_GID ."
}

# Named volumes are seeded from the image exactly once, ownership included.
# So a volume created under a different container user survives the rebuild
# that changed it, still owned by somebody who no longer exists in the image,
# and pnpm fails with EACCES on /app/node_modules. Docker does not notice,
# which is what this is for.
sync_container_user() {
  local want="${HOST_UID}:${HOST_GID}" have=""
  if [[ -f "$USER_STAMP" ]]; then
    have="$(cat "$USER_STAMP" 2>/dev/null || true)"
  fi

  # No stamp means a first run, where the volumes do not exist yet and get
  # seeded correctly on their own.
  if [[ -z "$have" || "$have" == "$want" ]]; then
    return 0
  fi

  warn "container user changed, $have -> $want"
  info "removing the dependency volumes so they reseed under the new owner"
  dc down --remove-orphans >/dev/null 2>&1 || true
  local volume
  for volume in backend-node-modules frontend-node-modules frontend-next; do
    docker volume rm "ourcityvoice-dev_${volume}" >/dev/null 2>&1 || true
  done
}

preflight() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed"
  docker compose version >/dev/null 2>&1 || die "the docker compose plugin is missing"
  docker info >/dev/null 2>&1 || die "the docker daemon is not reachable. Is it running?"

  if [[ ! -f "$ENV_FILE" ]]; then
    warn "no $ENV_FILE found, creating one from .env.example"
    cp .env.example "$ENV_FILE"
    ok "created $ENV_FILE. The defaults are fine for development."
  fi

  # After the env file exists, since it is one of the places this looks.
  resolve_container_user
}

# Reads a value out of .env without sourcing it (sourcing would run any
# shell metacharacters that ended up in a password).
env_value() {
  local key="$1" default="${2-}"
  local line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then printf '%s' "$default"; else printf '%s' "${line#*=}"; fi
}

cmd_up() {
  preflight
  check_source_ownership
  sync_container_user

  info "containers run as ${HOST_UID}:${HOST_GID} ${DIM}(${CONTAINER_USER_NOTE})${RESET}"
  info "building images (cached layers are reused)"
  dc build "$@"
  info "starting services"
  dc up -d --remove-orphans "$@"
  printf '%s:%s\n' "$HOST_UID" "$HOST_GID" >"$USER_STAMP"

  local backend_port frontend_port
  backend_port="$(env_value BACKEND_PORT 4000)"
  frontend_port="$(env_value FRONTEND_PORT 3000)"

  if ! command -v curl >/dev/null 2>&1; then
    warn "curl is not installed, skipping the health wait"
    dc ps
    return 0
  fi

  info "waiting for the API to report healthy"
  local i
  for i in $(seq 1 60); do
    if curl -fsS "http://localhost:${backend_port}/api/v1/health" >/dev/null 2>&1; then
      break
    fi
    if [[ $i -eq 60 ]]; then
      warn "API did not come up in 60s. Recent logs:"
      dc logs --tail 40 backend
      die "startup failed"
    fi
    sleep 1
  done

  echo
  ok "development environment is up"
  printf '   %sfrontend%s  http://localhost:%s\n'      "$BOLD" "$RESET" "$frontend_port"
  printf '   %sapi%s       http://localhost:%s/api/v1\n' "$BOLD" "$RESET" "$backend_port"
  printf '   %shealth%s    http://localhost:%s/api/v1/health\n' "$BOLD" "$RESET" "$backend_port"
  printf '   %sready%s     http://localhost:%s/api/v1/health/ready  %s(checks postgres)%s\n' \
    "$BOLD" "$RESET" "$backend_port" "$DIM" "$RESET"
  printf '   %spostgres%s  localhost:%s\n' "$BOLD" "$RESET" "$(env_value POSTGRES_PORT 5432)"
  echo
  printf '   %s./dev.sh logs%s to follow output, %s./dev.sh down%s to stop\n' \
    "$DIM" "$RESET" "$DIM" "$RESET"
  echo

  info "following logs (ctrl-c detaches, containers keep running)"
  dc logs -f --tail 20
}

cmd_down()    { preflight; info "stopping"; dc down --remove-orphans; ok "stopped. Data volumes kept."; }
cmd_restart() { preflight; info "restarting ${*:-all services}"; dc restart "$@"; ok "restarted"; }
cmd_logs()    { preflight; dc logs -f --tail "${TAIL:-100}" "$@"; }
cmd_ps()      { preflight; dc ps; }
cmd_build()   { preflight; info "rebuilding images"; dc build --no-cache "$@"; ok "built"; }

cmd_health() {
  preflight
  local port; port="$(env_value BACKEND_PORT 4000)"
  info "liveness"
  curl -fsS "http://localhost:${port}/api/v1/health" | sed 's/^/   /' || warn "liveness failed"
  echo
  info "readiness"
  curl -sS "http://localhost:${port}/api/v1/health/ready" | sed 's/^/   /' || warn "readiness failed"
  echo
}

cmd_psql() {
  preflight
  dc exec postgres psql -U "$(env_value POSTGRES_USER ocv)" -d "$(env_value POSTGRES_DB ourcityvoice)" "$@"
}

cmd_sh() {
  preflight
  local service="${1:-backend}"
  info "opening a shell in $service"
  dc exec "$service" sh
}

# Dependencies live in a named volume so the bind mount does not hide them.
# That volume does not update when package.json changes, so after adding a
# dependency you run this.
cmd_install() {
  preflight
  local service="${1:-backend}"
  info "reinstalling dependencies inside $service"
  dc exec "$service" pnpm install
  dc restart "$service"
  ok "done, $service restarted"
}

# ── database ────────────────────────────────────────────────────────
# All of these run inside the backend container, where compose has already
# set DATABASE_URL to point at the postgres service. Running them from your
# host would need a second DATABASE_URL pointing at localhost, and the two
# drift apart the moment you change a port.

cmd_migrate() {
  preflight
  if [[ $# -gt 0 ]]; then
    info "creating and applying migration: $*"
    dc exec backend pnpm prisma migrate dev --name "$*"
  else
    info "applying pending migrations"
    dc exec backend pnpm prisma migrate dev
  fi
  ok "database schema is up to date"
}

cmd_seed() {
  preflight
  warn "the seed truncates every table before inserting"
  dc exec backend pnpm db:seed
}

cmd_generate() {
  preflight
  info "regenerating the Prisma client into src/generated"
  dc exec backend pnpm db:generate
  ok "done. tsx will pick it up on the next reload."
}

# Prisma Studio is a database GUI. It binds inside the container, so the
# port has to be published for your browser to reach it.
cmd_studio() {
  preflight
  info "Prisma Studio on http://localhost:5555  (ctrl-c to stop)"
  dc exec -e BROWSER=none backend pnpm db:studio --port 5555
}

cmd_migrate_status() {
  preflight
  dc exec backend pnpm prisma migrate status
}

# Dependencies live in a named volume so the bind mount does not hide them.
# pnpm repairs that volume by itself when package.json changes. This is for
# the case it cannot fix: a volume seeded from an older image whose files are
# owned by the wrong user, which shows up as EACCES on /app/node_modules.
#
# ./dev.sh up does this automatically when the container user changes. Run it
# by hand when a volume is broken for some other reason.
cmd_refresh_deps() {
  preflight
  local service="${1:-backend}"
  info "recreating the $service dependency volumes from the image"
  dc stop "$service" >/dev/null 2>&1 || true
  dc rm -f "$service" >/dev/null 2>&1 || true
  docker volume rm "ourcityvoice-dev_${service}-node-modules" >/dev/null 2>&1 || true
  # The frontend has a second seeded volume, for .next.
  if [[ "$service" == "frontend" ]]; then
    docker volume rm "ourcityvoice-dev_frontend-next" >/dev/null 2>&1 || true
  fi
  dc up -d "$service"
  ok "$service restarted with fresh dependencies"
}

cmd_clean() {
  preflight
  warn "This deletes the postgres volume. Every row in your local database goes with it."
  read -r -p "Type the word 'destroy' to confirm: " answer
  [[ "$answer" == "destroy" ]] || { info "cancelled, nothing was removed"; return 0; }
  dc down -v --remove-orphans
  ok "containers and volumes removed. ./dev.sh up starts from an empty database."
}

cmd_reset() { cmd_clean; cmd_up; }

cmd_help() {
  cat <<EOF
${BOLD}OurCityVoice development environment${RESET}

  ${BOLD}./dev.sh${RESET} [command] [args]

${BOLD}everyday${RESET}
  up [service...]       build, start, wait for health, then follow logs ${DIM}(default)${RESET}
  down                  stop everything, keep the database
  restart [service...]  restart without rebuilding
  logs [service...]     follow logs
  ps                    what is running, and its health
  health                curl both health endpoints

${BOLD}database${RESET}
  migrate [name]        create and apply a migration ${DIM}(omit name to just apply)${RESET}
  migrate:status        which migrations have run
  seed                  load the frontend fixtures into real tables
  generate              regenerate the Prisma client after a schema edit
  studio                Prisma Studio, a database GUI, on :5555

${BOLD}digging in${RESET}
  psql [args...]        a psql prompt on the dev database
  sh [service]          a shell inside a container ${DIM}(default: backend)${RESET}
  install [service]     reinstall deps after editing package.json ${DIM}(default: backend)${RESET}
  refresh-deps [service]  rebuild the node_modules volume ${DIM}(fixes EACCES on it)${RESET}

${BOLD}starting over${RESET}
  build [service...]    rebuild images from scratch, no cache
  clean                 remove containers AND the database volume ${DIM}(asks first)${RESET}
  reset                 clean, then up

${BOLD}services${RESET}  postgres, backend, frontend

${DIM}Config lives in .env, created from .env.example on first run.

The dev containers run as your own uid:gid, so the bind mounted source is
readable from both sides on any machine. Set HOST_UID / HOST_GID yourself to
override that; changing either one triggers a rebuild of the dev images.

Production is a separate script: ./prod.sh help${RESET}
EOF
}

main() {
  local command="${1:-up}"
  [[ $# -gt 0 ]] && shift || true
  case "$command" in
    up)               cmd_up "$@" ;;
    down|stop)        cmd_down "$@" ;;
    restart)          cmd_restart "$@" ;;
    logs|log)         cmd_logs "$@" ;;
    ps|status)        cmd_ps "$@" ;;
    build|rebuild)    cmd_build "$@" ;;
    health)           cmd_health "$@" ;;
    psql|db)          cmd_psql "$@" ;;
    sh|shell|exec)    cmd_sh "$@" ;;
    install)          cmd_install "$@" ;;
    refresh-deps)     cmd_refresh_deps "$@" ;;
    migrate)          cmd_migrate "$@" ;;
    migrate:status)   cmd_migrate_status "$@" ;;
    seed)             cmd_seed "$@" ;;
    generate)         cmd_generate "$@" ;;
    studio)           cmd_studio "$@" ;;
    clean|nuke)       cmd_clean "$@" ;;
    reset)            cmd_reset "$@" ;;
    help|-h|--help)   cmd_help ;;
    *) die "unknown command '$command'. Try ./dev.sh help" ;;
  esac
}

main "$@"
