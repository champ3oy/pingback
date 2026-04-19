# Documentation Pages — Design Spec

**Date:** 2026-04-19

---

## Overview

5 documentation pages inside `apps/website` at `/docs/*`. Same grid-line aesthetic as the landing page. Sidebar nav on the left, content on the right, separated by a vertical border. Static React pages — no MDX.

## Layout

A `DocsLayout` wrapping all `/docs/*` routes:
- Left sidebar (~240px): list of doc nav links, active state highlighted
- Right content area: scrollable, contains the page content
- Vertical border between sidebar and content
- Diamond dots at grid intersections (sidebar/content border meets horizontal borders)
- Same `GridSection`-style outer container with `border-x` and `border-b`

## Routes

- `/docs` → redirect to `/docs/getting-started`
- `/docs/getting-started`
- `/docs/cron-jobs`
- `/docs/tasks`
- `/docs/context`
- `/docs/configuration`

## File Structure

```
apps/website/app/docs/
  layout.tsx                  — DocsLayout with sidebar + content
  page.tsx                    — redirect to /docs/getting-started
  getting-started/page.tsx
  cron-jobs/page.tsx
  tasks/page.tsx
  context/page.tsx
  configuration/page.tsx
apps/website/components/
  docs-sidebar.tsx            — sidebar nav component
  docs-content.tsx            — content wrapper with consistent styling
```

## Page Content

### Getting Started

1. **Install** — `npm install @pingback/next`
2. **Configure** — create `pingback.config.ts`:
```ts
import { defineConfig } from "@pingback/next";

export default defineConfig({
  apiKey: process.env.PINGBACK_API_KEY,
});
```
3. **Define your first cron** — create a file with a `cron()` call:
```ts
import { cron } from "@pingback/next";

export const dailyCleanup = cron(
  "daily-cleanup",
  "0 3 * * *",
  async (ctx) => {
    await removeExpiredSessions();
    ctx.log("Sessions cleaned up");
  }
);
```
4. **Set up the route handler** — create `app/api/__pingback/route.ts`:
```ts
import { createRouteHandler } from "@pingback/next";
export const { POST } = createRouteHandler();
```
5. **Add the Next.js plugin** — update `next.config.ts`:
```ts
import { withPingback } from "@pingback/next";
export default withPingback({});
```
6. **Set environment variables** — `PINGBACK_API_KEY` and `PINGBACK_CRON_SECRET`
7. **Deploy** — Pingback discovers your functions at build time and starts scheduling

### Cron Jobs

- **API:** `cron(name, schedule, handler, options?)`
  - `name` — unique identifier string
  - `schedule` — cron expression (5-field)
  - `handler` — `async (ctx) => { ... }` function
  - `options` — `{ retries?, timeout?, concurrency? }`
- **Schedule examples:**
  - `"*/15 * * * *"` — every 15 minutes
  - `"0 3 * * *"` — daily at 3am UTC
  - `"0 */6 * * *"` — every 6 hours
  - `"0 9 * * 1"` — every Monday at 9am
- **Options:**
  - `retries` (0-10, default 0) — retry on failure with exponential backoff
  - `timeout` ("30s", "5m", default "30s") — max execution time
  - `concurrency` (1-10, default 1) — max concurrent runs
- **Full example** with all options

### Tasks

- **API:** `task(name, handler, options?)`
  - Same signature as cron but no schedule
  - Triggered via `ctx.task()` from within a cron
- **Fan-out pattern:**
```ts
export const sendEmails = cron("send-emails", "*/15 * * * *", async (ctx) => {
  const pending = await getPendingEmails();
  for (const email of pending) {
    await ctx.task("send-email", { id: email.id });
  }
});

export const sendEmail = task("send-email", async (ctx, { id }) => {
  const email = await getEmail(id);
  await deliver(email);
}, { retries: 2, timeout: "15s" });
```
- Each task runs independently with its own retries and timeout
- Child tasks appear under the parent execution in the dashboard

### Context Object

Reference for the `ctx` object passed to every handler:

| Property | Type | Description |
|----------|------|-------------|
| `ctx.executionId` | `string` | Unique ID for this execution |
| `ctx.attempt` | `number` | Current retry attempt (1-indexed) |
| `ctx.scheduledAt` | `Date` | When this run was scheduled |
| `ctx.log(message)` | `(string) => void` | Add structured log entry |
| `ctx.task(name, payload)` | `(string, any) => Promise<void>` | Dispatch a child task |

With usage examples for each.

### Configuration

- **`pingback.config.ts`** — `defineConfig({ apiKey })` setup
- **Environment variables:**
  - `PINGBACK_API_KEY` — your project API key (from dashboard)
  - `PINGBACK_CRON_SECRET` — request signing secret (from dashboard)
- **`withPingback(nextConfig)`** — Next.js plugin that discovers functions at build time
- **Route handler** — `createRouteHandler()` at `/api/__pingback`

## Visual Style

- Same warm dark charcoal background, border grid lines, diamond dots
- Code blocks: dark `bg-[#0d1117]` with Shiki syntax highlighting (github-dark theme)
- Section headings in foreground color, body text in muted-foreground
- Active sidebar link highlighted with accent color text or left border accent
- Consistent padding and spacing matching the landing page sections
