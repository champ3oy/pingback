# @usepingback/nestjs Adapter — Design Spec

**Date:** 2026-04-21
**Package:** `packages/nestjs`
**Depends on:** `@usepingback/core`

## Overview

A NestJS adapter for Pingback that uses decorators (`@Cron`, `@Task`) on injectable service methods, a dynamic module for configuration, auto-registered route controller, and startup-time function registration.

## User-facing API

### Module registration

```typescript
// app.module.ts
import { PingbackModule } from '@usepingback/nestjs';

@Module({
  imports: [
    PingbackModule.register({
      apiKey: process.env.PINGBACK_API_KEY,
      cronSecret: process.env.PINGBACK_CRON_SECRET,
      routePath: '/api/pingback', // optional, default
    }),
  ],
})
export class AppModule {}
```

### Defining functions

```typescript
// jobs/email.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, Task, PingbackContext } from '@usepingback/nestjs';

@Injectable()
export class EmailService {
  constructor(private mailer: MailerService) {}

  @Cron('send-emails', '*/15 * * * *', { retries: 3, timeout: '60s' })
  async sendEmails(ctx: PingbackContext) {
    const pending = await this.getPending();
    for (const email of pending) {
      ctx.task('send-email', { id: email.id });
    }
    ctx.log('Dispatched emails', { count: pending.length });
  }

  @Task('send-email', { retries: 2, timeout: '15s' })
  async sendEmail(ctx: PingbackContext, payload: { id: string }) {
    await this.mailer.send(payload.id);
    ctx.log('Sent email', { id: payload.id });
  }
}
```

### Structured logging

Same API as `@usepingback/core`:

```typescript
ctx.log('message');                          // info
ctx.log('message', { key: 'value' });        // info with metadata
ctx.log.warn('slow query', { ms: 2500 });    // warning
ctx.log.error('failed', { code: 'E001' });   // error
ctx.log.debug('cache stats', { hits: 847 }); // debug
```

### Fan-out

```typescript
ctx.task('task-name', { payload: 'data' });
```

## Config interface

```typescript
interface PingbackModuleOptions {
  apiKey: string;
  cronSecret: string;
  baseUrl?: string;       // auto-detected from request if not set
  routePath?: string;     // default: '/api/pingback'
  platformUrl?: string;   // default: 'https://api.pingback.lol'
}
```

## Architecture

### File structure

```
packages/nestjs/
├── src/
│   ├── decorators.ts          # @Cron(), @Task() decorators
│   ├── pingback.module.ts     # PingbackModule.register(), OnModuleInit scanning + registration
│   ├── pingback.controller.ts # Auto-registered POST endpoint
│   └── index.ts               # Public API exports
├── tests/
│   ├── decorators.spec.ts
│   ├── module.spec.ts
│   └── controller.spec.ts
├── package.json
├── tsconfig.json
└── README.md
```

### decorators.ts

- `@Cron(name, schedule, options?)` — method decorator that stores metadata via `Reflect.defineMetadata`
- `@Task(name, options?)` — method decorator, same mechanism
- Metadata key: `PINGBACK_FUNCTION_METADATA`
- Stored metadata shape: `{ name, type: 'cron' | 'task', schedule?, options }`

### pingback.module.ts

- `PingbackModule.register(options)` — `DynamicModule` that provides:
  - `PINGBACK_OPTIONS` injection token with the config
  - `PingbackController` as a controller
  - `DiscoveryService` from `@nestjs/core` for scanning
- `OnModuleInit` lifecycle hook:
  1. Uses `DiscoveryService` to get all providers
  2. Scans each provider's prototype methods for `PINGBACK_FUNCTION_METADATA`
  3. Builds a registry: `Map<string, { instance, methodName, metadata }>`
  4. POSTs to `{platformUrl}/api/v1/register` with collected function metadata and endpoint URL (`{baseUrl}{routePath}`)
- Exports the registry so the controller can access it

### pingback.controller.ts

- Route: `POST {routePath}` (default `/api/pingback`)
- Request flow:
  1. Extract `X-Pingback-Signature` and `X-Pingback-Timestamp` headers
  2. Verify HMAC using `verifySignature` from `@usepingback/core` with `cronSecret`
  3. Parse body to get `function` name, `executionId`, `attempt`, `scheduledAt`, `payload`
  4. Look up handler in the registry by function name
  5. Create context via `createContext` from `@usepingback/core`
  6. Call `instance[methodName](ctx)` for crons or `instance[methodName](ctx, payload)` for tasks
  7. Return `{ status: 'success', result, logs: ctx._getLogs(), tasks: ctx._getTasks(), durationMs }`
  8. On error: return `{ status: 'error', error: message, logs: ctx._getLogs(), tasks: ctx._getTasks(), durationMs }` with HTTP 500

### index.ts

Exports:
- `PingbackModule`
- `Cron` decorator
- `Task` decorator
- `PingbackContext` (re-export of `Context` from core)
- `PingbackModuleOptions` interface

## Data flow

1. **App boots** → `PingbackModule.onModuleInit()` scans all providers for `@Cron`/`@Task` metadata → builds registry → POSTs metadata to platform
2. **Platform schedules job** → sends signed POST to `{baseUrl}/api/pingback`
3. **Controller receives request** → verifies HMAC → finds handler → creates context → executes → returns result
4. **Platform processes response** → saves logs, handles retries, dispatches fan-out tasks

## Dependencies

```json
{
  "dependencies": {
    "@usepingback/core": "0.2.0"
  },
  "peerDependencies": {
    "@nestjs/common": ">=10",
    "@nestjs/core": ">=10",
    "reflect-metadata": ">=0.1"
  }
}
```

## Environment variables

```
PINGBACK_API_KEY=pb_live_...
PINGBACK_CRON_SECRET=...
```

## Edge cases

- **No functions found:** Log a warning on startup, don't error.
- **Registration fails:** Log error but don't crash the app. Functions won't be scheduled until registration succeeds.
- **Invalid signature:** Return 401 with `{ error: 'Invalid signature' }`.
- **Unknown function:** Return 404 with `{ error: 'Function not found' }`.
- **Handler throws:** Catch, return 500 with error message and collected logs/tasks.
- **baseUrl not set:** Auto-detect from the first incoming request's `Host` header and protocol, then register lazily on first execution.
