# Phase 1: Platform API — Design Spec

**Date:** 2026-04-17
**Scope:** Complete the remaining Phase 1 deliverables — scheduler, worker, basic API, auth

## Overview

Phase 1 has database entities and core SDK done. This spec covers everything needed to make the platform functional: authentication, CRUD APIs, SDK registration, job scheduling, execution dispatch, and alert notifications.

## Decisions

- **Auth:** Both JWT + GitHub OAuth (dashboard) and API key auth (SDK/programmatic) built now
- **Registration:** Upsert approach — SDK is source of truth for SDK-sourced jobs; stale jobs deactivated on deploy
- **Process model:** Scheduler and worker run in the same process as separate NestJS modules, designed for easy extraction later
- **Queue:** pgboss on PostgreSQL (replaces BullMQ + Redis) — fewer dependencies, transactional safety with execution records
- **Alerts:** Evaluated inline on execution failure; missed run alerts checked during scheduler tick

## Module Architecture

```
apps/platform/src/
├── app.module.ts
├── main.ts
├── config/configuration.ts
├── common/
│   └── encryption.ts
│
├── modules/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts         # /auth/register, /auth/login, /auth/github, /auth/refresh
│   │   ├── auth.service.ts            # Login, register, token management
│   │   ├── jwt.strategy.ts            # Passport JWT strategy
│   │   ├── github.strategy.ts         # Passport GitHub OAuth strategy
│   │   ├── api-key.strategy.ts        # Passport custom strategy for Bearer API keys
│   │   ├── api-key.guard.ts
│   │   ├── jwt-auth.guard.ts
│   │   └── dto/
│   │
│   ├── projects/
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts     # CRUD /api/v1/projects
│   │   ├── projects.service.ts        # Project CRUD, cron secret generation
│   │   ├── api-keys.controller.ts     # CRUD /api/v1/projects/:projectId/api-keys
│   │   ├── api-keys.service.ts        # Key generation, hashing, validation
│   │   ├── registration.controller.ts # POST /api/v1/register
│   │   ├── registration.service.ts    # Upsert logic, deactivate stale jobs
│   │   └── dto/
│   │
│   ├── jobs/
│   │   ├── jobs.module.ts
│   │   ├── jobs.controller.ts         # CRUD /api/v1/jobs (API key), /projects/:projectId/jobs (JWT)
│   │   ├── jobs.service.ts            # Job CRUD, next_run_at calculation via cron-parser
│   │   ├── executions.controller.ts   # GET executions (both API key and JWT scoped)
│   │   ├── executions.service.ts      # Execution CRUD, status transitions, project-wide queries
│   │   ├── logs.controller.ts         # GET /projects/:projectId/logs (aggregated log query)
│   │   ├── logs.service.ts            # Cross-execution log aggregation and search
│   │   └── dto/
│   │
│   ├── alerts/
│   │   ├── alerts.module.ts
│   │   ├── alerts.controller.ts       # CRUD /api/v1/projects/:projectId/alerts
│   │   ├── alerts.service.ts          # Alert CRUD + evaluation logic
│   │   ├── notifiers/
│   │   │   └── email.notifier.ts      # Resend email sending
│   │   └── dto/
│   │
│   ├── queue/
│   │   ├── queue.module.ts            # Creates and exports PgBoss instance
│   │   └── queue.service.ts           # Thin wrapper: send(), work(), lifecycle
│   │
│   ├── scheduler/
│   │   ├── scheduler.module.ts
│   │   └── scheduler.service.ts       # 10s tick loop, enqueues due jobs
│   │
│   └── worker/
│       ├── worker.module.ts
│       └── worker.service.ts          # Subscribes via QueueService, HTTP dispatch
```

## Auth

### JWT Auth (dashboard users)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Email + password, returns JWT pair |
| POST | `/auth/login` | Email + password, returns access token (15min) + refresh token (7d) |
| GET | `/auth/github` | Initiates GitHub OAuth flow |
| GET | `/auth/github/callback` | OAuth callback, creates/links user, returns JWT |
| POST | `/auth/refresh` | Refresh token to new access token |

- Access token payload: `{ sub: userId, email }`
- Refresh tokens stored as bcrypt hash in a `refresh_token` column on the user entity

### API Key Auth (SDK + programmatic)

- Project-scoped, format: `pb_live_<random32bytes>`
- On creation: full key shown once, stored as bcrypt hash + prefix (`pb_live_abc...`)
- Validation: iterate project API keys matching the prefix, bcrypt compare
- Resolves to both the project and its owning user

### Guard mapping

| Endpoints | Guard | Reason |
|-----------|-------|--------|
| `/auth/*` | Public | Login, register, OAuth |
| `/api/v1/register` | ApiKey | SDK calls at deploy time |
| `/api/v1/jobs`, `/api/v1/executions` | ApiKey | SDK and programmatic access |
| `/api/v1/projects/**` | JWT | Dashboard — user manages projects, jobs, keys, alerts |

## API Endpoints

### SDK / Programmatic — API key guard

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/register` | SDK function upsert |
| POST | `/api/v1/jobs` | Create manual job |
| GET | `/api/v1/jobs` | List jobs (filter by status, paginated) |
| GET | `/api/v1/jobs/:id` | Job detail |
| PATCH | `/api/v1/jobs/:id` | Update schedule/config/pause/resume |
| DELETE | `/api/v1/jobs/:id` | Delete job |
| POST | `/api/v1/jobs/:id/run` | Trigger immediate execution |
| GET | `/api/v1/jobs/:id/executions` | List executions for a job (paginated) |
| GET | `/api/v1/executions/:id` | Execution detail with logs |

### Dashboard — JWT guard

| Method | Path | Description |
|--------|------|-------------|
| **Projects** | | |
| GET | `/api/v1/projects` | List user's projects |
| POST | `/api/v1/projects` | Create project (generates cron secret) |
| GET | `/api/v1/projects/:projectId` | Project detail |
| DELETE | `/api/v1/projects/:projectId` | Delete project + cascade |
| **Jobs** | | |
| GET | `/api/v1/projects/:projectId/jobs` | List jobs (filterable by `type`, `status`) |
| GET | `/api/v1/projects/:projectId/jobs/:id` | Job detail |
| PATCH | `/api/v1/projects/:projectId/jobs/:id` | Pause/resume/update |
| DELETE | `/api/v1/projects/:projectId/jobs/:id` | Delete job |
| POST | `/api/v1/projects/:projectId/jobs/:id/run` | Trigger immediate run |
| **Runs** | | |
| GET | `/api/v1/projects/:projectId/executions` | All executions across project (paginated, filterable by `status`, `jobId`, `dateFrom`, `dateTo`) |
| GET | `/api/v1/projects/:projectId/executions/:id` | Execution detail with logs |
| **Logs** | | |
| GET | `/api/v1/projects/:projectId/logs` | Aggregated log entries from `executions.logs` JSONB, flattened across executions (filterable by `jobId`, `dateFrom`, `dateTo`, searchable by `q` against `message` field, paginated) |
| **API Keys** | | |
| POST | `/api/v1/projects/:projectId/api-keys` | Create key (returns full key once) |
| GET | `/api/v1/projects/:projectId/api-keys` | List keys (prefix + metadata only) |
| DELETE | `/api/v1/projects/:projectId/api-keys/:id` | Revoke key |
| **Alerts** | | |
| POST | `/api/v1/projects/:projectId/alerts` | Create alert rule |
| GET | `/api/v1/projects/:projectId/alerts` | List alerts |
| PATCH | `/api/v1/projects/:projectId/alerts/:id` | Update alert |
| DELETE | `/api/v1/projects/:projectId/alerts/:id` | Delete alert |

## Registration (SDK Upsert)

`POST /api/v1/register`

**Request:**
```json
{
  "project_id": "uuid",
  "functions": [
    { "name": "send-emails", "type": "cron", "schedule": "*/15 * * * *", "options": { "retries": 3, "timeout": "60s", "concurrency": 1 } },
    { "name": "send-single-email", "type": "task", "options": { "retries": 2, "timeout": "15s" } }
  ]
}
```

**Logic:**
1. Validate API key belongs to the given project
2. For each function:
   - Exists (`projectId + name`): update schedule, options, set `status = 'active'`
   - New: create job, parse cron expression to calculate `next_run_at`
3. All SDK-sourced jobs in this project NOT in the incoming list: set `status = 'inactive'`
4. Task-type functions: stored with `schedule = null`, not scheduled — metadata only until Phase 5

**Response:**
```json
{
  "jobs": [
    { "name": "send-emails", "status": "active" },
    { "name": "send-single-email", "status": "active" }
  ]
}
```

## Scheduler

NestJS service, starts on `OnModuleInit`.

**Tick loop** (every 10 seconds):
1. Query: `SELECT * FROM jobs WHERE status = 'active' AND next_run_at <= NOW() AND schedule IS NOT NULL`
2. For each due job:
   - Check no pending/running execution exists for this `scheduled_at` (duplicate prevention)
   - Create `execution` record with `status = 'pending'`, `scheduled_at = job.next_run_at`
   - `pgboss.send('pingback-execution', queueMessage)`
   - Update `job.next_run_at` to next cron occurrence, `job.last_run_at` to now
   - All in a single PostgreSQL transaction (execution insert + enqueue in same DB)
3. After processing due jobs: check for missed runs (jobs where `last_run_at` is > 2x the cron interval overdue), evaluate `missed_run` alerts

## Worker

Uses `pgboss.work('pingback-execution', handler)`.

**Processing flow:**
1. Update execution: `status = 'running'`, `started_at = now`
2. HTTP dispatch: `POST {endpointUrl}` with:
   - Body: `{ function, executionId, attempt, scheduledAt }`
   - Headers: `X-Pingback-Signature` (HMAC via project's `cronSecret`), `X-Pingback-Timestamp`
   - Timeout: `timeoutSeconds` via `AbortController`
3. Record result:
   - Success (2xx): `status = 'success'`, store `http_status`, `response_body` (truncated 10KB), `duration_ms`, `logs`
   - Failure: `status = 'failed'`, store error details
4. Retry: if failed and `attempt < maxRetries`, `pgboss.send('pingback-execution', payload, { startAfter: backoffSeconds })` with exponential backoff `Math.min(2^attempt * 1000, 60000)` ms
5. Alert evaluation: on failure, call `alertsService.evaluate(job, execution)` inline

## Queue (pgboss)

Replaces BullMQ + Redis. pgboss manages its own schema (`pgboss.*` tables) in the same PostgreSQL database.

- Single `PgBoss` instance created in `QueueModule`
- Job type name: `pingback-execution`
- `QueueService` wraps `send()` and `work()` for the rest of the app
- Dependencies to remove: `bullmq`, `ioredis`, `@nestjs/bullmq`
- Dependencies to add: `pg-boss`

## Alerts

### Evaluation (inline with execution failure)

When worker records a failed execution, calls `alertsService.evaluate(job, execution)`:

1. Fetch alert rules for the job's project — project-level (`job_id IS NULL`) and job-specific, where `enabled = true`
2. Check trigger:
   - `consecutive_failures`: query last N executions for job, all `status = 'failed'` where N = `trigger_value`
   - `duration_exceeded`: `execution.duration_ms > trigger_value * 1000`
   - `missed_run`: checked during scheduler tick, not inline
3. Cooldown: skip if `last_fired_at + cooldown_seconds > now`
4. Fire: send email via Resend — subject `[Pingback] Job "{job.name}" failed`, body includes job name, project name, error message, attempt count, dashboard link
5. Update `alert.last_fired_at = now`

### Missed run detection

During scheduler tick, after processing due jobs:
- Query active jobs where `last_run_at` is > 2x the cron interval overdue
- Evaluate `missed_run` alerts for those jobs

## Entity Changes

**User entity** — add column:
- `refresh_token` (text, nullable) — stores bcrypt hash of refresh token

## Dependency Changes

**Remove:** `bullmq`, `ioredis`, `@nestjs/bullmq`
**Add:** `pg-boss`
