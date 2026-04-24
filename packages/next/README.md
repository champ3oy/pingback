# @usepingback/next

Next.js SDK for [Pingback](https://pingback.lol) -- reliable cron jobs and background tasks.

## Installation

```bash
npm install @usepingback/next
```

## Quick Start with CLI

The fastest way to get started:

```bash
npx pingback init
```

This scaffolds your project: creates `pingback.config.ts`, wraps `next.config.ts`, creates the route handler, and adds an example function.

### CLI Commands

| Command | Description |
|---------|-------------|
| `npx pingback init` | Scaffold project (config, route handler, example function) |
| `npx pingback dev [port]` | Start a tunnel for local development |
| `npx pingback help` | Show help |

## Manual Setup

### 1. Create `pingback.config.ts` in your project root

```ts
import { defineConfig } from "@usepingback/next";

export default defineConfig({
  apiKey: process.env.PINGBACK_API_KEY,
});
```

### 2. Wrap your Next.js config

```ts
// next.config.ts
import { withPingback } from "@usepingback/next";

export default withPingback({
  // your existing Next.js config
});
```

### 3. Set environment variables

```
PINGBACK_API_KEY=pb_live_...        # For build-time registration
PINGBACK_CRON_SECRET=...            # For runtime request verification
```

## Defining Functions

### Cron Jobs

Create files in `lib/pingback/` (configurable):

```ts
// lib/pingback/review-emails.ts
import { cron } from "@usepingback/next";

export const sendReviewEmails = cron(
  "send-review-emails",     // unique name
  "*/15 * * * *",           // cron expression (every 15 minutes)
  async (ctx) => {
    const pending = await db.emails.findPending();

    for (const email of pending) {
      await sendEmail(email);
      ctx.log(`Sent email to ${email.to}`);
    }

    return { processed: pending.length };
  },
  {
    retries: 3,              // retry up to 3 times within the same execution
    timeout: "60s",          // timeout after 60 seconds
    concurrency: 1,          // don't overlap runs
  }
);
```

### Background Tasks

```ts
// lib/pingback/send-email.ts
import { task } from "@usepingback/next";

export const sendSingleEmail = task(
  "send-single-email",
  async (ctx, payload: { emailId: string }) => {
    const email = await db.emails.findById(payload.emailId);
    await mailer.send(email);
    ctx.log(`Sent to ${email.to}`);
    return { sent: true };
  },
  { retries: 2, timeout: "15s" }
);
```

### Fan-Out with `ctx.task()`

Use `ctx.task()` inside a cron to dispatch independent sub-tasks:

```ts
import { cron, task } from "@usepingback/next";

export const sendEmails = cron("send-emails", "*/15 * * * *", async (ctx) => {
  const pending = await db.emails.findPending();
  for (const email of pending) {
    await ctx.task("send-email", { id: email.id });
  }
  ctx.log(`Dispatched ${pending.length} emails`);
});

export const sendEmail = task("send-email", async (ctx, { id }) => {
  const email = await db.emails.findById(id);
  await mailer.send(email);
}, { retries: 2, timeout: "15s" });
```

Each task runs independently with its own retries and timeout.

### Workflows (Task Chaining)

Tasks can call `ctx.task()` to chain into multi-step workflows with branching:

```ts
import { task } from "@usepingback/next";

export const validateOrder = task("validate-order", async (ctx, payload) => {
  ctx.log("Validating", { orderId: payload.orderId });

  if (payload.amount <= 0) {
    ctx.task("notify-failure", { orderId: payload.orderId, reason: "Invalid amount" });
    return { valid: false };
  }

  ctx.task("charge-payment", payload);
  return { valid: true };
}, { retries: 2 });

export const chargePayment = task("charge-payment", async (ctx, payload) => {
  const charge = await stripe.charges.create({ amount: payload.amount * 100 });
  ctx.log("Charged", { chargeId: charge.id });
  ctx.task("send-confirmation", payload);
}, { retries: 3 });

export const sendConfirmation = task("send-confirmation", async (ctx, payload) => {
  await mailer.send(payload.email, "Order confirmed");
  ctx.log("Confirmation sent");
}, { retries: 2 });
```

Each step runs as its own execution with independent retries and logging. The workflow graph in your dashboard visualizes the full chain.

## Programmatic Triggering

Use `PingbackClient` to trigger tasks from your application code — no cron schedule or fan-out needed:

```ts
import { PingbackClient } from "@usepingback/next";

const pingback = new PingbackClient({
  apiKey: process.env.PINGBACK_API_KEY!,
});

// e.g. after a user signs up
const { executionId } = await pingback.trigger("send-onboarding-email", {
  userId: user.id,
});
```

`trigger()` returns an `{ executionId }` you can use for tracking. The task must already be registered in your project (defined with `task()` and deployed).

## Route Handler

The route handler is imported from `@usepingback/next/handler`:

```ts
// app/api/pingback/route.ts
import { createRouteHandler } from "@usepingback/next/handler";

export const { GET, POST } = createRouteHandler();
```

## Context Object

Every function receives a `ctx` object:

```ts
ctx.executionId  // Unique ID for this execution
ctx.attempt      // Current retry attempt (1-indexed)
ctx.scheduledAt  // When this run was originally scheduled
ctx.log(message) // Add a log entry (visible in dashboard)
ctx.task(name, payload) // Dispatch a child task (fan-out)
```

### Structured Logging

`ctx.log()` supports multiple log levels and structured metadata:

```ts
// Info (default)
ctx.log("processing batch");
ctx.log("user created", { userId: "u_123" });

// Warning
ctx.log.warn("slow query", { ms: 2500 });

// Error
ctx.log.error("failed", { code: "E001" });

// Debug
ctx.log.debug("cache stats", { hits: 847 });
```

All log entries are visible in the Pingback dashboard.

## Configuration

```ts
defineConfig({
  apiKey: string;          // Required -- your Pingback API key
  baseUrl?: string;        // Your app's public URL (auto-detected on Vercel)
  platformUrl?: string;    // Pingback API URL (default: https://api.pingback.lol)
  routePath?: string;      // Route handler path (default: /api/pingback)
  functionsDir?: string;   // Glob for function files (default: lib/pingback/**/*.{ts,js})
});
```

## Local Development

Use `pingback dev` to develop and test functions locally:

```bash
npx pingback dev 3000
```

This starts a tunnel that exposes your local server to the Pingback platform. Your functions are registered using the tunnel URL, so the platform can invoke them on your machine just like it would in production.

## How It Works

1. `withPingback()` hooks into `next build`
2. Discovers files in `lib/pingback/` that import from `@usepingback/next`
3. Generates `app/api/pingback/route.ts` (add to `.gitignore`)
4. Registers discovered functions with the Pingback platform
5. At runtime, the platform sends signed requests to your route handler
6. The handler verifies the HMAC signature and executes the function

## Cron Expression Examples

| Expression | Description |
|-----------|-------------|
| `* * * * *` | Every minute |
| `*/15 * * * *` | Every 15 minutes |
| `0 * * * *` | Every hour |
| `0 9 * * *` | Daily at 9 AM UTC |
| `0 9 * * 1` | Every Monday at 9 AM UTC |
| `0 0 1 * *` | First of every month at midnight |
