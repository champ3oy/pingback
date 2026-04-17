# @pingback/platform

The Pingback API server — handles scheduling, execution, and monitoring of cron jobs and background tasks.

## Requirements

- Node.js >= 20
- PostgreSQL

## Setup

### 1. Create `.env` file

```bash
cp .env.example .env
```

Required environment variables:

```
DATABASE_URL=postgresql://user@localhost:5432/pingback
JWT_SECRET=<random-string>
ENCRYPTION_KEY=<64-char-hex-string>
```

Optional (enable features):

```
GITHUB_CLIENT_ID=<github-oauth-client-id>
GITHUB_CLIENT_SECRET=<github-oauth-client-secret>
RESEND_API_KEY=<resend-api-key-for-email-alerts>
DASHBOARD_URL=http://localhost:3000
```

### 2. Create database

```bash
createdb pingback
```

Tables are auto-created on first start (TypeORM `synchronize: true`).

### 3. Install and run

```bash
# From the monorepo root
npm install

# Start in dev mode
cd apps/platform
npm run start:dev
```

The API runs at `http://localhost:4000`. Swagger docs at `http://localhost:4000/docs`.

## Architecture

The platform runs as a single process with three logical components:

| Component | What it does |
|-----------|-------------|
| **API Server** | REST endpoints for projects, jobs, executions, alerts, auth |
| **Scheduler** | 10-second tick loop that finds due jobs and enqueues them |
| **Worker** | Processes the queue, dispatches HTTP requests to user apps |

Job queue is powered by [pgboss](https://github.com/timgit/pg-boss) (PostgreSQL-based, no Redis needed).

## API Overview

### Authentication

Two auth methods:

- **JWT** (dashboard) — `POST /auth/register`, `POST /auth/login`, GitHub OAuth
- **API Key** (SDK) — `Bearer pb_live_...` header

### Endpoints

| Group | Path | Auth | Description |
|-------|------|------|-------------|
| Auth | `/auth/*` | Public | Register, login, OAuth, token refresh |
| Projects | `/api/v1/projects` | JWT | CRUD for projects |
| API Keys | `/api/v1/projects/:id/api-keys` | JWT | Create, list, revoke keys |
| Registration | `/api/v1/register` | API Key | SDK function registration |
| Jobs | `/api/v1/jobs` | API Key | CRUD for jobs (SDK/programmatic) |
| Jobs | `/api/v1/projects/:id/jobs` | JWT | CRUD for jobs (dashboard) |
| Executions | `/api/v1/projects/:id/executions` | JWT | Execution history |
| Logs | `/api/v1/projects/:id/logs` | JWT | Aggregated log search |
| Alerts | `/api/v1/projects/:id/alerts` | JWT | Alert rules CRUD |

Full API documentation available at `/docs` (Swagger UI).

## Testing

```bash
npm test          # Run all tests
npm run test:e2e  # Run e2e tests
```
