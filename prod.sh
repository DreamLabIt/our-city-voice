#!/usr/bin/env bash
#
# OurCityVoice production stack. Meant to run on the VPS, not your laptop.
#
#   ./prod.sh help
#
# Deliberately has no default command. On a server, a bare ./prod.sh that
# silently restarts things is a bad idea.

set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.prod"

if [[ -t 1 ]]; then
  BOLD=$'\033[1m'; DIM=$'\033[2m'; RED=$'\033[31m'; GREEN=$'\033[32m'
  YELLOW=$'\033[33m'; BLUE=$'\033[34m'; RESET=$'\033[0m'
else
  BOLD=''; DIM=''; RED=''; GREEN=''; YELLOW=''; BLUE=''; RESET=''
fi

info() { printf '%s==>%s %s\n' "$BLUE$BOLD" "$RESET" "$*"; }
ok()   { printf '%s ok %s %s\n' "$GREEN$BOLD" "$RESET" "$*"; }
warn() { printf '%s!!!%s %s\n' "$YELLOW$BOLD" "$RESET" "$*" >&2; }
die()  { printf '%serr%s %s\n' "$RED$BOLD" "$RESET" "$*" >&2; exit 1; }

dc() { docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"; }

preflight() {
  command -v docker >/dev/null 2>&1 || die "docker is not installed"
  docker compose version >/dev/null 2>&1 || die "the docker compose plugin is missing"
  docker info >/dev/null 2>&1 || die "the docker daemon is not reachable"

  [[ -f "$ENV_FILE" ]] || die \
    "$ENV_FILE is missing. On the server: cp .env.prod.example $ENV_FILE && chmod 600 $ENV_FILE"

  if grep -q 'CHANGE_ME' "$ENV_FILE"; then
    die "$ENV_FILE still contains CHANGE_ME. Set a real database password first:
       openssl rand -base64 32"
  fi

  # A world-readable file holding the database password is worth shouting about.
  local mode
  mode="$(stat -c '%a' "$ENV_FILE" 2>/dev/null || echo '')"
  if [[ -n "$mode" && "$mode" != "600" ]]; then
    warn "$ENV_FILE is mode $mode. It holds secrets: chmod 600 $ENV_FILE"
  fi
}

env_value() {
  local key="$1" default="${2-}" line
  line="$(grep -E "^${key}=" "$ENV_FILE" | tail -n 1 || true)"
  if [[ -z "$line" ]]; then printf '%s' "$default"; else printf '%s' "${line#*=}"; fi
}

cmd_up() {
  preflight
  info "building production images"
  dc build "$@"
  info "starting"
  dc up -d --remove-orphans "$@"
  ok "stack is up. ./prod.sh ps to check health, ./prod.sh logs to watch."
}

# A deploy is: new code, new images, rolling replace. No bind mounts means
# nothing on the server drifts from what is in git.
cmd_deploy() {
  preflight
  info "pulling latest code"
  git pull --ff-only
  info "rebuilding images"
  dc build
  info "replacing containers"
  dc up -d --remove-orphans
  info "removing images the new build orphaned"
  docker image prune -f >/dev/null
  ok "deployed"
  dc ps
}

cmd_down()    { preflight; warn "taking the site offline"; dc down --remove-orphans; ok "stopped"; }
cmd_restart() { preflight; dc restart "$@"; ok "restarted ${*:-all services}"; }
cmd_logs()    { preflight; dc logs -f --tail "${TAIL:-200}" "$@"; }
cmd_ps()      { preflight; dc ps; }

# Config changes under infra/nginx are mounted read-only, so a reload picks
# them up without dropping a single connection.
cmd_reload() {
  preflight
  info "validating nginx config"
  dc exec nginx nginx -t || die "config is invalid, not reloading"
  dc exec nginx nginx -s reload
  ok "nginx reloaded with zero downtime"
}

cmd_psql() {
  preflight
  dc exec postgres psql -U "$(env_value POSTGRES_USER ocv)" -d "$(env_value POSTGRES_DB ourcityvoice)" "$@"
}

cmd_backup() {
  preflight
  mkdir -p backups
  local file="backups/ourcityvoice-$(date -u +%Y%m%dT%H%M%SZ).sql.gz"
  info "dumping database to $file"
  dc exec -T postgres pg_dump \
    -U "$(env_value POSTGRES_USER ocv)" \
    -d "$(env_value POSTGRES_DB ourcityvoice)" \
    | gzip > "$file"
  ok "wrote $file ($(du -h "$file" | cut -f1))"
  warn "a backup on the same disk as the database is not a backup. Copy it off the server."
}

# Issues a certificate using the webroot shared with nginx. nginx must
# already be running and reachable on port 80 at this domain.
cmd_certbot() {
  preflight
  local domain="${1:-}" email="${2:-}"
  [[ -n "$domain" && -n "$email" ]] || die "usage: ./prod.sh certbot <domain> <email>"

  info "requesting a certificate for $domain"
  dc run --rm --entrypoint certbot certbot \
    certonly --webroot -w /var/www/certbot \
    -d "$domain" --email "$email" \
    --agree-tos --no-eff-email --non-interactive

  ok "certificate issued"
  cat <<EOF

Next:
  1. edit infra/nginx/conf.d/default.conf
     uncomment the https server block, replace your-domain.com with $domain
     uncomment the "return 301 https://..." line in the http block
  2. ./prod.sh reload

Renewal is not automatic yet. Add this to the server's crontab:
  0 3 * * * cd $ROOT && ./prod.sh renew >> /var/log/ocv-certbot.log 2>&1
EOF
}

cmd_renew() {
  preflight
  dc run --rm --entrypoint certbot certbot renew --webroot -w /var/www/certbot
  dc exec nginx nginx -s reload
  ok "renewal check complete"
}

cmd_help() {
  cat <<EOF
${BOLD}OurCityVoice production stack${RESET}

  ${BOLD}./prod.sh${RESET} <command> [args]

${BOLD}running it${RESET}
  up [service...]       build and start
  deploy                git pull, rebuild, replace containers, prune
  down                  stop everything ${DIM}(the site goes offline)${RESET}
  restart [service...]  restart without rebuilding
  logs [service...]     follow logs
  ps                    what is running, and its health

${BOLD}nginx and tls${RESET}
  reload                validate and hot-reload nginx config
  certbot <domain> <email>   issue a certificate
  renew                 renew certificates, then reload nginx

${BOLD}database${RESET}
  psql [args...]        a psql prompt on the production database
  backup                gzipped pg_dump into ./backups

${DIM}Config comes from .env.prod, which is gitignored and lives only on the
server. Start from .env.prod.example.

While the frontend is on Vercel you can run without its container:
  ./prod.sh up postgres backend nginx${RESET}
EOF
}

main() {
  [[ $# -gt 0 ]] || { cmd_help; exit 0; }
  local command="$1"; shift
  case "$command" in
    up)             cmd_up "$@" ;;
    deploy)         cmd_deploy "$@" ;;
    down|stop)      cmd_down "$@" ;;
    restart)        cmd_restart "$@" ;;
    logs|log)       cmd_logs "$@" ;;
    ps|status)      cmd_ps "$@" ;;
    reload)         cmd_reload "$@" ;;
    certbot|cert)   cmd_certbot "$@" ;;
    renew)          cmd_renew "$@" ;;
    psql|db)        cmd_psql "$@" ;;
    backup)         cmd_backup "$@" ;;
    help|-h|--help) cmd_help ;;
    *) die "unknown command '$command'. Try ./prod.sh help" ;;
  esac
}

main "$@"
