# Fan-Out Tasks (`ctx.task()`) — Design Spec

**Date:** 2026-04-19

---

## Overview

Enable cron handlers to spawn independent sub-tasks via `ctx.task(name, payload)`. Each child task runs as its own execution with its own retries, timeout, and status tracking. Child tasks are dispatched after the parent completes (response-based approach).

## SDK Changes

### `packages/core/src/context.ts`

Replace the `ctx.task()` stub that throws an error. Instead, collect task requests in an internal array.

- `ctx.task(name, payload)` pushes `{ name, payload }` to an internal `tasks` array (no HTTP call, no error).
- Add `_getTasks(): Array<{ name: string; payload: any }>` internal method alongside `_getLogs()`.

Updated `ContextWithLogs` interface becomes `ContextWithInternals` (or similar), exposing both `_getLogs()` and `_getTasks()`.

### `packages/core/src/types.ts`

Add `payload` to `ExecutionPayload`:

```ts
export interface ExecutionPayload {
  function: string;
  executionId: string;
  attempt: number;
  scheduledAt: string;
  payload?: any;  // NEW — task payload from ctx.task()
}
```

### `packages/next/src/handler.ts`

Update the route handler response to include collected tasks:

```json
{
  "status": "success",
  "result": { "processed": 5 },
  "logs": [{ "timestamp": 1713500000, "message": "..." }],
  "tasks": [
    { "name": "send-email", "payload": { "id": "123" } },
    { "name": "send-email", "payload": { "id": "456" } }
  ]
}
```

Also pass `payload` from the incoming request to the handler as the second argument:

```ts
const result = await definition.handler(ctx, payload.payload);
```

This enables task handlers to receive the data passed via `ctx.task()`.

## Platform Changes

### Execution Entity

Add two columns to `apps/platform/src/modules/executions/execution.entity.ts`:

```ts
@Column({ type: 'uuid', nullable: true, name: 'parent_id' })
parentId: string | null;

@Column({ type: 'jsonb', nullable: true })
payload: any;
```

Requires a database migration to add these columns to the `executions` table.

### Worker Service

After a successful execution, if the response body contains a `tasks` array:

1. For each task entry `{ name, payload }`:
   - Look up the Job record by `name` + `projectId`
   - If no matching job found, log a warning and skip (task function not registered)
   - Create a child Execution with:
     - `jobId` = the task job's ID
     - `parentId` = the parent execution's ID
     - `payload` = the task payload
     - `status` = pending
     - `scheduledAt` = now
     - `attempt` = 1
   - Enqueue to pgboss `pingback-execution` queue with:
     - All standard fields (executionId, jobId, projectId, functionName, endpointUrl, cronSecret, attempt, maxRetries, timeoutSeconds, scheduledAt)
     - `payload` included in the queue message

When processing any execution, include `payload` in the HTTP request body to the SDK endpoint:

```json
{
  "function": "send-email",
  "executionId": "...",
  "attempt": 1,
  "scheduledAt": "...",
  "payload": { "id": "123" }
}
```

### Executions Service

- `createPending` needs to accept optional `parentId` and `payload` parameters.
- No changes to `markRunning` or `markCompleted`.

### Executions Controller

Add `parentId` query parameter to `GET /api/v1/projects/:projectId/executions`:
- When `parentId` is provided, filter to executions where `parent_id = :parentId`.
- This enables the dashboard to fetch child executions for a given parent.

## Dashboard Changes

### Runs Page — Expanded Detail View

When viewing an execution that has children, show a "Child Tasks" section below the existing detail content:

- Fetch children via `GET /projects/:projectId/executions?parentId=<executionId>`
- Display as a simple table: Name, Status, Duration, Attempt
- Each child row is clickable to expand its own detail

For child executions, show a "Parent Execution" label linking back (scrolling to) the parent.

### Hooks

- Update `useExecutions` to accept optional `parentId` filter parameter.
- Or add a dedicated `useChildExecutions(projectId, parentId)` hook — simpler and avoids overloading the existing hook.

## Data Flow

```
1. Cron handler runs:
   ctx.task("send-email", { id: "123" })
   ctx.task("send-email", { id: "456" })

2. SDK handler collects tasks, returns in response:
   { status: "success", tasks: [...], logs: [...] }

3. Worker receives response, processes tasks array:
   For each task:
     → Look up Job by name
     → Create Execution (parentId = parent exec ID, payload = task payload)
     → Enqueue to pgboss

4. Worker picks up child execution from queue:
   → POST to SDK endpoint with payload
   → SDK handler calls definition.handler(ctx, payload)
   → Task function processes the item

5. Dashboard shows parent execution with expandable child tasks
```

## Out of Scope

- Nested fan-out (task calling ctx.task()) — could work naturally since the same mechanism applies, but we won't explicitly design for or test it in this iteration.
- Fan-out limits (max tasks per execution) — not enforced for now, can add later per pricing tier.
- Real-time child task progress — children are fetched on demand, no WebSocket streaming.
