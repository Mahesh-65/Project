# Sports Community Platform (Microservices)

Production-ready starter monorepo for a sports community application with 7 microservices, Next.js frontend, MongoDB, Redis, Docker, and deployment-oriented configuration.

## Architecture

- `frontend` (Next.js): user-facing responsive web app
- `user-service`: accounts, cookie sessions, profiles, preferences
- `player-service`: player discovery, matches, waiting list, chat metadata
- `team-service`: teams, invites, captain controls, stats
- `tournament-service`: tournaments, fixtures, tables, rankings
- `ground-service`: grounds/turfs, bookings, expense split
- `shop-service`: products, cart, checkout, orders
- `admin-service`: dashboard, moderation, analytics, reports
- `database`: SQL schema, migrations, seed scripts, backup placeholders, docs

## Tech Stack

- Frontend: Next.js 14 + React 18
- Backend: Node.js + Express
- Databases: MongoDB (service-specific database per microservice), Redis (cache + notifications)
- Auth: Cookie + session store (`express-session` + Redis)
- Communication: REST between services
- Containerization: Docker + Docker Compose

## Quick Start

1. Start full stack:
   - `docker compose up --build`
2. Open:
   - Frontend: `http://localhost:3000`
   - Services: ports `4001-4007`

## Services and Ports

- `user-service` -> `4001`
- `player-service` -> `4002`
- `team-service` -> `4003`
- `tournament-service` -> `4004`
- `ground-service` -> `4005`
- `shop-service` -> `4006`
- `admin-service` -> `4007`

## Production Notes

- Add TLS termination via Nginx/Traefik in deployment.
- Move secrets to vault/secret manager.
- Replace demo payment/shipping logic with providers.
- Add CI checks, SAST/DAST, and infrastructure policies.
- Configure centralized logs (ELK/OpenSearch), metrics (Prometheus), traces (OTel).

## API Coverage

Each service includes:
- Health endpoint
- Domain CRUD/search endpoints
- Validation + standard error middleware
- PostgreSQL wiring and schema bootstrap
- Redis client wiring (cache/session/pubsub foundation)

## Frontend Coverage

- Responsive pages for:
  - Home/discovery
  - Auth/profile
  - Matches
  - Teams
  - Tournaments
  - Grounds/bookings/splits
  - Shop/cart/orders
  - Admin dashboard overview
- Dark mode support
- Multi-language ready scaffolding

## Database Folder

`database/` contains:
- `schemas/` SQL schema by service
- `migrations/` initial migration scripts
- `seeds/` sample seed datasets
- `backups/` backup placeholder
- docs and operational notes

## Local Development Without Docker

Run each service:
1. `cd <service>`
2. `npm install`
3. `npm run dev`

Run frontend:
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Next Steps

- Integrate OAuth/SMS providers
- Add websocket gateway for realtime chat/push
- Add test suites (unit/integration/e2e) and load testing profiles
- Expand RBAC and audit logging
