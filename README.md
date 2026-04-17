# Pingback

Cron jobs and background tasks for modern web apps. Starting with Next.js.

Pingback is a platform with framework-specific SDKs that let you define scheduled functions and background tasks directly in your codebase. Pingback handles scheduling, execution, retries, and provides a dashboard for monitoring.

## Packages

| Package | Description |
|---------|-------------|
| [`@pingback/next`](packages/next) | Next.js SDK adapter |
| [`@pingback/core`](packages/core) | Framework-agnostic core (used internally) |
| [`@pingback/platform`](apps/platform) | API server, scheduler, and worker |
| [`@pingback/shared-types`](shared/types) | Shared TypeScript types |

## Quick Start (Next.js)

### 1. Install

```bash
npm install @pingback/next
```

### 2. Create config

```ts
// pingback.config.ts
import { defineConfig } from "@pingback/next";

export default defineConfig({
  apiKey: process.env.PINGBACK_API_KEY,
});
```

### 3. Wrap your Next.js config

```ts
// next.config.ts
import { withPingback } from "@pingback/next";

export default withPingback({
  // your existing config
});
```

### 4. Define a cron job

```ts
// lib/pingback/review-emails.ts
import { cron } from "@pingback/next";

export const sendReviewEmails = cron(
  "send-review-emails",
  "*/15 * * * *",
  async (ctx) => {
    const pending = await getPendingEmails();
    ctx.log(`Processing ${pending.length} emails`);
    return { processed: pending.length };
  },
  { retries: 3, timeout: "60s" }
);
```

### 5. Set environment variables

```
PINGBACK_API_KEY=pb_live_...        # From your Pingback project settings
PINGBACK_CRON_SECRET=...            # From your Pingback project settings
```

### 6. Build & deploy

```bash
next build
```

That's it. Your cron functions are automatically discovered, registered with Pingback, and a route handler is generated at `/api/__pingback`.

## How It Works

1. **At build time:** `withPingback()` scans your codebase for `cron()` and `task()` calls, generates a route handler at `app/api/__pingback/route.ts`, and registers your functions with the Pingback platform.

2. **At runtime:** When a job is due, the Pingback scheduler enqueues it. The worker sends an HMAC-signed POST request to your app's `/api/__pingback` endpoint. The route handler verifies the signature, executes the function, and returns the result.

3. **On the dashboard:** You can see execution history, logs, success/failure status, and configure alerts.

## Architecture

```
Your Next.js App                    Pingback Platform
┌──────────────────┐               ┌──────────────────────┐
│  lib/pingback/   │               │  Scheduler (10s tick) │
│    emails.ts     │               │         │             │
│    sync.ts       │               │         ▼             │
│                  │  ◄── POST ──  │  Worker (HTTP dispatch)│
│  /api/__pingback │               │         │             │
│  (auto-generated)│  ── result ─► │  Executions DB        │
└──────────────────┘               │  Dashboard API        │
                                   └──────────────────────┘
```

## Development

This is a monorepo using npm workspaces.

```bash
# Install all dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start the platform locally
cd apps/platform
cp .env.example .env  # Edit with your database credentials
npm run start:dev
# API at http://localhost:4000
# Swagger docs at http://localhost:4000/docs
```

## Project Structure

```
pingback/
├── apps/
│   └── platform/          # NestJS API server + scheduler + worker
├── packages/
│   ├── core/              # Framework-agnostic SDK core
│   └── next/              # Next.js adapter
└── shared/
    └── types/             # Shared TypeScript types
```

## License

MIT
