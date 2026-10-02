# OurCityVoice

A civic issue reporting platform. Residents file infrastructure problems,
track their status, and comment on reports from their ward.

```
frontend/   Next.js 16, App Router, Tailwind v4
backend/    Node + Express 5 + TypeScript, PostgreSQL
infra/      nginx config for the production reverse proxy
```

## Getting started

Requires Docker with the compose plugin. Nothing else, not even Node.

```bash
./dev.sh
```

That builds the images, starts Postgres, waits for the API's health check to
pass, and follows the logs. First run takes a few minutes while images
download; later runs take seconds.

| what | where |
| --- | --- |
| frontend | http://localhost:3000 |
| api | http://localhost:4000/api/v1 |
| liveness | http://localhost:4000/api/v1/health |
| readiness | http://localhost:4000/api/v1/health/ready |
| postgres | `localhost:5432`, credentials in `.env` |

`./dev.sh help` lists every command. The ones worth knowing early:

```bash
./dev.sh logs backend     # follow one service
./dev.sh psql             # psql prompt on the dev database
./dev.sh sh backend       # shell inside a container
./dev.sh install backend  # after editing a package.json
./dev.sh clean            # delete containers and the database volume
```

Source is bind mounted, so edits reload without rebuilding. Dependencies are
not: they live in a named volume, which is why adding a package needs
`./dev.sh install`.

## Two health endpoints, on purpose

`/health` is liveness. It touches nothing and answers 200 as long as the
process can serve HTTP. Docker's `HEALTHCHECK` and any load balancer use it.

`/health/ready` is readiness. It pings Postgres and returns 503 when the
database is unreachable.

Keeping them apart matters. If liveness checked the database, a 30 second
Postgres blip would make Docker restart a perfectly healthy API container,
and restarting the API does not fix the database.

## Architecture

The backend is layered, and the dependency direction only goes one way:

```
routes/        HTTP wiring. Path, method, middleware chain.
controllers/   Read the request, call a service, pick a status code.
services/      Business rules, transactions, authorization.
repositories/  Database access. The only layer that imports the ORM.
```

Two rules keep it honest. Nothing above `repositories/` touches the ORM, and
nothing below `controllers/` knows what HTTP is. A service never sees a `req`
or a `res`, which is what makes it testable by calling it with plain
arguments.

`src/modules/health/` is the worked example of the shape.

Everything the app reads from the environment is declared in
`src/config/env.ts` and parsed with Zod at boot. A missing variable kills the
process immediately with a readable message instead of surfacing as a
confusing failure on the third request after a deploy. No `process.env`
access anywhere else.

## Database

The schema lives in `backend/docs/generate-er.py`, which is both the readable
source of truth and the generator for `backend/docs/database-er.txt`.

To view the diagram: copy the contents of `database-er.txt` and paste into
[excalidraw.com](https://excalidraw.com).

To change the schema: edit the `SCHEMA` block in the generator, run
`python3 backend/docs/generate-er.py`, and paste again. The diff stays
readable because the Python is what you edit, not the 90KB of JSON.

Migrations do not exist yet. They are the next thing to build.

## Production

The production stack adds nginx and removes every convenience that would be
a liability on a server. Postgres publishes no port, nothing is bind
mounted, and nginx is the only container reachable from the internet.

```bash
# on the VPS
cp .env.prod.example .env.prod && chmod 600 .env.prod
# fill in a real password: openssl rand -base64 32
./prod.sh up
```

`./prod.sh help` covers deploys, backups, and TLS. The nginx config ships
HTTP-only so the stack starts before you own a domain; `./prod.sh certbot
<domain> <email>` issues a certificate and tells you the two lines to
uncomment.

While the frontend is on Vercel, skip its container:

```bash
./prod.sh up postgres backend nginx
```

## The Vercel and VPS wrinkle

With the frontend on `*.vercel.app` and the API on your own domain, they are
different sites, so an httpOnly auth cookie is a third-party cookie. It needs
`SameSite=None; Secure`, and Safari and Brave block it regardless.

The fix while on Vercel is a Next.js `rewrites` rule proxying `/api/*` to the
backend, so the browser only ever talks to the Vercel origin and the cookie
stays first-party. Costs one network hop. Once both live under one apex
domain (`app.example.com` and `api.example.com`), a cookie with
`Domain=.example.com` and `SameSite=Lax` works directly.

CORS already allows `*.vercel.app` preview URLs outside production, since
Vercel mints a new one per commit. In production the allowlist is exact.

## Database workflow

The schema lives in `backend/prisma/schema.prisma`. Everything below runs
inside the backend container, where `DATABASE_URL` already points at the
`postgres` service.

```bash
./dev.sh migrate add_something  # create and apply a migration
./dev.sh migrate                # apply pending migrations
./dev.sh migrate:status         # what has run
./dev.sh seed                   # load fixtures (truncates first)
./dev.sh generate               # regenerate the client after a schema edit
./dev.sh studio                 # database GUI on :5555
```

Seeding gives you 36 users, 13 reports, 31 comments and 178 likes, built from
`frontend/data/mock-data.ts`. Every account's password is `password123`.

When the frontend fixtures change, re-extract them:

```bash
cd backend && pnpm seed:extract && cd .. && ./dev.sh seed
```

Three decisions in the schema that are worth knowing about:

**Generated client in `src/`, not `node_modules`.** The schema uses Prisma's
`prisma-client` generator with `output = "../src/generated/prisma"`. The
production Docker stage installs a fresh `node_modules` with production
dependencies only, so a client generated into `node_modules` during the build
would be discarded. Emitting into `src/` means `tsc` compiles it into `dist/`
like any other module. `src/generated/` is gitignored; run `./dev.sh generate`
after cloning.

**BigInt ids, serialised as strings.** `JSON.stringify` refuses to touch a
BigInt and throws, so `src/lib/serialize.ts` teaches it to emit a string.
Strings are the right wire format anyway: a JSON number above 2^53 loses
precision when the browser parses it, and the frontend's types already declare
`id: string`.

**Counters are caches, and the seed proves it.** `posts.like_count` and
`comment_count` are recomputed from the rows actually inserted, never copied
from the fixture numbers. `post_status_history` is append-only and is what
makes "average time to resolution" answerable at all.

Two constraints live in a hand-written migration because Prisma's schema
language cannot express them: a unique index on `lower(email)`, and
`CHECK (id = 1)` on the single-row `site_contact_info` table.
