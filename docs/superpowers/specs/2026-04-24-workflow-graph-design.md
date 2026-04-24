# Workflow Graph Visualization — Design Spec

**Date:** 2026-04-24

---

## Scope

Add an inline workflow graph to the execution detail page that visualizes task chains (parent → child execution trees) using React Flow. The graph appears only when an execution is part of a chain.

**No changes to:** SDKs, registration protocol, worker, scheduler, or database schema.

## Context

Pingback supports task chaining — any handler (cron or task) can call `ctx.task()` to dispatch child tasks. Each child runs as its own execution with retries, logging, and monitoring. The platform already tracks parent/child relationships via the `parentId` column on executions (indexed). Today, child tasks are shown as a flat table on the execution detail page. This feature adds a visual graph to show the full chain.

---

## 1. Backend — Workflow Tree Endpoint

### New Endpoint

**`GET /api/v1/executions/:id/workflow`**

Returns the full execution tree for any node in a chain.

**Logic:**
1. Load the requested execution
2. Walk up via `parentId` to find the root execution
3. Recursively fetch all descendants from the root
4. Return a flat array of nodes

**Response:**
```json
{
  "rootId": "exec-aaa",
  "nodes": [
    {
      "id": "exec-aaa",
      "functionName": "process-batch",
      "type": "cron",
      "status": "success",
      "durationMs": 150,
      "attempt": 1,
      "maxRetries": 3,
      "parentId": null,
      "jobId": "job-123",
      "scheduledAt": "2026-04-24T10:00:00Z",
      "completedAt": "2026-04-24T10:00:01Z"
    },
    {
      "id": "exec-bbb",
      "functionName": "step1",
      "type": "task",
      "status": "success",
      "durationMs": 80,
      "attempt": 1,
      "maxRetries": 2,
      "parentId": "exec-aaa",
      "jobId": "job-456",
      "scheduledAt": "2026-04-24T10:00:01Z",
      "completedAt": "2026-04-24T10:00:02Z"
    },
    {
      "id": "exec-ccc",
      "functionName": "step2",
      "type": "task",
      "status": "failed",
      "durationMs": 42,
      "attempt": 2,
      "maxRetries": 2,
      "parentId": "exec-bbb",
      "jobId": "job-789",
      "scheduledAt": "2026-04-24T10:00:02Z",
      "completedAt": "2026-04-24T10:00:03Z"
    }
  ]
}
```

**Auth:** Same as other execution endpoints — project-scoped, requires valid session or API key.

**Error cases:**
- 404 if execution not found
- 404 if execution has no parent and no children (not part of a chain)

### Implementation

**Service method** in `executions.service.ts`:

```typescript
async getWorkflowTree(executionId: string): Promise<{ rootId: string; nodes: WorkflowNode[] }> {
  // 1. Find the requested execution
  // 2. Walk up via parentId to find root
  // 3. Fetch all descendants recursively using parentId index
  // 4. Return flat array with rootId
}
```

Walking up is a simple loop (chains are unlikely to be deeply nested). Walking down uses recursive queries filtered by `parentId` (already indexed).

**Controller** — add a new route in `executions.controller.ts` or a dedicated `workflow.controller.ts`.

### Detecting if an execution is part of a chain

The frontend needs to know whether to show the graph icon. Two options:

**Option A:** Add a `hasChildren` boolean to the existing execution response. Requires a COUNT query.
**Option B:** The frontend checks if `parentId` is set OR calls the workflow endpoint and handles 404.

**Go with Option A** — add `hasChildren` to the execution detail response. The icon shows when `parentId !== null || hasChildren === true`.

---

## 2. Frontend — Workflow Graph

### Dependencies

- `@xyflow/react` (React Flow v12) — the graph rendering library
- `dagre` + `@types/dagre` — automatic top-to-bottom layout for the node graph

### Hook

**`useWorkflowTree(executionId)`** in `lib/hooks/use-executions.ts`:
- Endpoint: `GET /api/v1/executions/${executionId}/workflow`
- Query key: `["workflow", executionId]`
- `enabled`: only fetch when the graph section is expanded
- No polling needed — tree is static after the chain completes

### Icon Button

Located in the execution detail header row (the dark bar with function name, status badge, duration, etc.):
- Use `IconGitBranch` from `@tabler/icons-react`
- Only rendered when `execution.parentId !== null || execution.hasChildren`
- Toggles the inline graph section open/closed
- Tooltip: "View workflow"

### Inline Graph Section

When the icon is clicked, a section expands between the execution header and the Trace/Payload grid:
- Full width of the `RunDetail` component
- Height: 300px (fixed, with React Flow's built-in pan/zoom for overflow)
- Border: `border-t border-border` consistent with existing sections
- Background: matches existing `bg-background`
- Collapse on second click (toggle state)

### Custom Node Component

Each execution in the chain renders as a card-style React Flow node:

```
┌─────────────────────────┐
│ ● send-onboarding-email │  ← function name + status dot
│                         │
│ Success ✓    262ms      │  ← status badge + duration
│ Attempt 1/2            │  ← attempt info
│                         │
│ [↻ Retry]              │  ← only on failed nodes
└─────────────────────────┘
```

**Node styling:**
- Dark card background matching the dashboard palette
- Rounded corners (`rounded-lg`)
- Subtle border, brighter border on the currently-viewed execution
- Status dot color in header: green (#a8b545) success, red (#d4734a) failed, yellow (#e8b44a) running/pending
- Width: ~220px fixed
- Padding: consistent with existing card components

**Node interactions:**
- Click → navigate to that execution's detail page (except current node)
- Current node has a highlighted border (glow or brighter color) to indicate "you are here"

### Retry Button on Failed Nodes

- Small button inside the node, only visible when `status === 'failed'`
- Calls existing `POST /api/v1/jobs/:jobId/run` with the same payload
- Uses existing retry/run-now infrastructure
- Shows a loading spinner while the retry is in progress
- On success, invalidates the workflow query to refresh the graph

### Edges

- Connect parent → child using `parentId` relationships
- Style: dashed lines (matching the reference image aesthetic)
- Color by child's status:
  - Green (#a8b545) — success
  - Red (#d4734a) — failed
  - Yellow (#e8b44a) — running
  - Gray (muted) — pending
- Animated edge for "running" status (React Flow supports this natively)

### Layout

- Use dagre with `rankdir: 'TB'` (top-to-bottom)
- Auto-fit the graph to the viewport on initial render (`fitView`)
- Node spacing: ~60px vertical gap, ~40px horizontal gap
- React Flow controls: zoom buttons in bottom-right corner (minimap not needed for typical chain sizes)

---

## 3. File Structure

```
apps/platform/src/modules/executions/
  executions.controller.ts   ← add GET /:id/workflow route
  executions.service.ts      ← add getWorkflowTree() method

apps/dashboard/
  components/
    workflow-graph.tsx        ← React Flow container + data transformation
    workflow-node.tsx         ← custom node component
  lib/hooks/
    use-executions.ts         ← add useWorkflowTree hook
  app/(dashboard)/[projectId]/runs/
    page.tsx                  ← add icon button + inline section to RunDetail
```

---

## 4. Node-to-Edge Transformation

The frontend converts the flat `nodes` array into React Flow format:

```typescript
// Nodes
const rfNodes = nodes.map(node => ({
  id: node.id,
  type: 'workflowNode',
  data: {
    ...node,
    isCurrent: node.id === currentExecutionId,
  },
  position: { x: 0, y: 0 }, // dagre will compute
}));

// Edges (derived from parentId)
const rfEdges = nodes
  .filter(n => n.parentId)
  .map(node => ({
    id: `${node.parentId}-${node.id}`,
    source: node.parentId,
    target: node.id,
    style: { stroke: statusColor(node.status) },
    animated: node.status === 'running',
    type: 'default',
  }));
```

---

## 5. Edge Cases

- **Single parent, no children (orphan task):** If an execution has `parentId` set but the parent has no other children and no further chain, the graph shows two nodes. Still useful.
- **Large fan-out (10+ children):** Dagre handles this fine with horizontal spreading. React Flow's pan/zoom covers overflow.
- **Running chain:** Nodes show real-time status. The hook doesn't poll, but the user can close/reopen the graph to refresh, or we add a refresh button.
- **Deeply nested chains:** Unlikely in practice (3-5 levels typical), but dagre + pan/zoom handles arbitrary depth.
- **Deleted parent execution:** If the root execution was deleted, walk-up stops at the first available ancestor. Show what exists.
