# Documentation Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build 5 documentation pages at `/docs/*` inside `apps/website` with a sidebar layout matching the landing page's grid-line aesthetic.

**Architecture:** A docs layout with sidebar nav and content area. Each doc page is a static React component with code examples using the existing `CodeBlock` pattern (Shiki + github-dark). Sidebar highlights the active page. The navbar "Docs" link points to `/docs` which redirects to `/docs/getting-started`.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shiki

---

## File Structure

| File | Responsibility |
|------|---------------|
| `apps/website/components/docs-code.tsx` | Reusable code block for docs (wraps Shiki) |
| `apps/website/components/docs-sidebar.tsx` | Sidebar nav with active state |
| `apps/website/app/docs/layout.tsx` | Docs layout with sidebar + content area + grid lines |
| `apps/website/app/docs/page.tsx` | Redirect to /docs/getting-started |
| `apps/website/app/docs/getting-started/page.tsx` | Getting started guide |
| `apps/website/app/docs/cron-jobs/page.tsx` | Cron jobs reference |
| `apps/website/app/docs/tasks/page.tsx` | Tasks and fan-out reference |
| `apps/website/app/docs/context/page.tsx` | Context object reference |
| `apps/website/app/docs/configuration/page.tsx` | Configuration reference |
| `apps/website/components/navbar.tsx` | Update Docs link to point to /docs |

---

### Task 1: Docs code block component

**Files:**
- Create: `apps/website/components/docs-code.tsx`

- [ ] **Step 1: Create the docs code block component**

Create `apps/website/components/docs-code.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

interface DocsCodeProps {
  code: string;
  lang?: string;
}

export function DocsCode({ code, lang = "typescript" }: DocsCodeProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    codeToHtml(code.trim(), {
      lang,
      theme: "github-dark",
    }).then(setHtml);
  }, [code, lang]);

  return (
    <div className="rounded-lg border bg-[#0d1117] p-4 overflow-auto my-4">
      {html ? (
        <div
          className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!text-[13px] [&_pre]:!leading-6 [&_code]:!text-[13px] [&_code]:!leading-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="text-[13px] leading-6 font-mono text-gray-400">
          <code>{code.trim()}</code>
        </pre>
      )}
    </div>
  );
}

export function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-[13px] bg-muted px-1.5 py-0.5 rounded font-mono">
      {children}
    </code>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/components/docs-code.tsx
git commit -m "feat(website): add docs code block component"
```

---

### Task 2: Docs sidebar

**Files:**
- Create: `apps/website/components/docs-sidebar.tsx`

- [ ] **Step 1: Create the sidebar component**

Create `apps/website/components/docs-sidebar.tsx`:

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/docs/getting-started", label: "Getting Started" },
  { href: "/docs/cron-jobs", label: "Cron Jobs" },
  { href: "/docs/tasks", label: "Tasks" },
  { href: "/docs/context", label: "Context Object" },
  { href: "/docs/configuration", label: "Configuration" },
];

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 py-8 px-4">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4 px-2">
        Documentation
      </p>
      <ul className="space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block text-sm px-2 py-1.5 rounded transition-colors ${
                  isActive
                    ? "text-accent font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/components/docs-sidebar.tsx
git commit -m "feat(website): add docs sidebar nav component"
```

---

### Task 3: Docs layout and redirect

**Files:**
- Create: `apps/website/app/docs/layout.tsx`
- Create: `apps/website/app/docs/page.tsx`
- Modify: `apps/website/components/navbar.tsx`

- [ ] **Step 1: Create the docs layout**

Create `apps/website/app/docs/layout.tsx`:

```typescript
import { Navbar } from "@/components/navbar";
import { DocsSidebar } from "@/components/docs-sidebar";
import { GridDot } from "@/components/grid-section";
import { Footer } from "@/components/footer";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <div className="border-b">
        <div className="max-w-5xl mx-auto border-x relative min-h-[calc(100vh-3.5rem)]">
          <GridDot className="-top-[5px] -left-[5px]" />
          <GridDot className="-top-[5px] -right-[5px]" />
          <GridDot className="-bottom-[5px] -left-[5px]" />
          <GridDot className="-bottom-[5px] -right-[5px]" />
          <div className="flex">
            <div className="hidden md:block border-r">
              <div className="sticky top-14">
                <DocsSidebar />
              </div>
            </div>
            <article className="flex-1 min-w-0 px-8 py-10 prose-invert">
              {children}
            </article>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Create the redirect page**

Create `apps/website/app/docs/page.tsx`:

```typescript
import { redirect } from "next/navigation";

export default function DocsPage() {
  redirect("/docs/getting-started");
}
```

- [ ] **Step 3: Update navbar Docs link**

In `apps/website/components/navbar.tsx`, change:
```typescript
          <Link href="https://docs.pingback.dev" className="text-sm text-foreground hover:text-foreground/70 transition-colors">
            Docs
          </Link>
```
to:
```typescript
          <Link href="/docs" className="text-sm text-foreground hover:text-foreground/70 transition-colors">
            Docs
          </Link>
```

- [ ] **Step 4: Verify it compiles**

Run: `cd apps/website && npx tsc --noEmit --pretty 2>&1 | head -20`

- [ ] **Step 5: Commit**

```bash
git add apps/website/app/docs/ apps/website/components/navbar.tsx
git commit -m "feat(website): add docs layout with sidebar, redirect, and nav link"
```

---

### Task 4: Getting Started page

**Files:**
- Create: `apps/website/app/docs/getting-started/page.tsx`

- [ ] **Step 1: Create the getting started page**

Create `apps/website/app/docs/getting-started/page.tsx`:

```typescript
import { DocsCode, InlineCode } from "@/components/docs-code";

export const metadata = { title: "Getting Started — Pingback Docs" };

export default function GettingStartedPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Getting Started</h1>
      <p className="text-muted-foreground mb-8">
        Get Pingback running in your Next.js app in under 10 minutes.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">1. Install the SDK</h2>
      <DocsCode code="npm install @pingback/next" lang="bash" />

      <h2 className="text-xl font-semibold mt-10 mb-3">2. Configure</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Create <InlineCode>pingback.config.ts</InlineCode> in your project root:
      </p>
      <DocsCode code={`import { defineConfig } from "@pingback/next";

export default defineConfig({
  apiKey: process.env.PINGBACK_API_KEY,
});`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">3. Define your first cron</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Create a file (e.g. <InlineCode>lib/pingback/cleanup.ts</InlineCode>) with a cron function:
      </p>
      <DocsCode code={`import { cron } from "@pingback/next";

export const dailyCleanup = cron(
  "daily-cleanup",
  "0 3 * * *",
  async (ctx) => {
    await removeExpiredSessions();
    ctx.log("Sessions cleaned up");
  }
);`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">4. Set up the route handler</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Create <InlineCode>app/api/__pingback/route.ts</InlineCode>:
      </p>
      <DocsCode code={`import { createRouteHandler } from "@pingback/next";

export const { POST } = createRouteHandler();`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">5. Add the Next.js plugin</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Update your <InlineCode>next.config.ts</InlineCode>:
      </p>
      <DocsCode code={`import { withPingback } from "@pingback/next";

export default withPingback({
  // your existing Next.js config
});`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">6. Set environment variables</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Add these to your <InlineCode>.env.local</InlineCode>:
      </p>
      <DocsCode code={`PINGBACK_API_KEY=pb_live_your_api_key_here
PINGBACK_CRON_SECRET=your_cron_secret_here`} lang="bash" />
      <p className="text-sm text-muted-foreground mt-2">
        You can find both values in the Pingback dashboard under your project settings.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">7. Deploy</h2>
      <p className="text-sm text-muted-foreground">
        Deploy your app. Pingback discovers your functions at build time, registers them
        with the platform, and starts scheduling. You can monitor executions in the dashboard.
      </p>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/app/docs/getting-started/
git commit -m "feat(website): add Getting Started docs page"
```

---

### Task 5: Cron Jobs page

**Files:**
- Create: `apps/website/app/docs/cron-jobs/page.tsx`

- [ ] **Step 1: Create the cron jobs page**

Create `apps/website/app/docs/cron-jobs/page.tsx`:

```typescript
import { DocsCode, InlineCode } from "@/components/docs-code";

export const metadata = { title: "Cron Jobs — Pingback Docs" };

export default function CronJobsPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Cron Jobs</h1>
      <p className="text-muted-foreground mb-8">
        Define scheduled functions that run on a cron expression.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">API</h2>
      <DocsCode code={`cron(name: string, schedule: string, handler: Function, options?: Options)`} />
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p><InlineCode>name</InlineCode> — unique identifier for this cron job.</p>
        <p><InlineCode>schedule</InlineCode> — standard 5-field cron expression.</p>
        <p><InlineCode>handler</InlineCode> — async function receiving a context object.</p>
        <p><InlineCode>options</InlineCode> — optional configuration (see below).</p>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Schedule Expressions</h2>
      <div className="rounded-lg border overflow-hidden my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Expression</th>
              <th className="text-left p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b"><td className="p-3 font-mono">*/15 * * * *</td><td className="p-3">Every 15 minutes</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">0 3 * * *</td><td className="p-3">Daily at 3:00 AM UTC</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">0 */6 * * *</td><td className="p-3">Every 6 hours</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">0 9 * * 1</td><td className="p-3">Every Monday at 9:00 AM</td></tr>
            <tr><td className="p-3 font-mono">0 0 1 * *</td><td className="p-3">First day of every month</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Options</h2>
      <div className="rounded-lg border overflow-hidden my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Option</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Default</th>
              <th className="text-left p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b"><td className="p-3 font-mono">retries</td><td className="p-3">0–10</td><td className="p-3">0</td><td className="p-3">Retry attempts with exponential backoff</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">timeout</td><td className="p-3">string</td><td className="p-3">"30s"</td><td className="p-3">Max execution time (e.g. "30s", "5m")</td></tr>
            <tr><td className="p-3 font-mono">concurrency</td><td className="p-3">1–10</td><td className="p-3">1</td><td className="p-3">Max concurrent executions</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Full Example</h2>
      <DocsCode code={`import { cron } from "@pingback/next";

export const syncData = cron(
  "sync-data",
  "0 */6 * * *",
  async (ctx) => {
    ctx.log("Starting data sync");
    const records = await fetchRecordsToSync();

    for (const record of records) {
      await syncRecord(record);
    }

    ctx.log(\`Synced \${records.length} records\`);
    return { synced: records.length };
  },
  {
    retries: 3,
    timeout: "5m",
    concurrency: 1,
  }
);`} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/app/docs/cron-jobs/
git commit -m "feat(website): add Cron Jobs docs page"
```

---

### Task 6: Tasks page

**Files:**
- Create: `apps/website/app/docs/tasks/page.tsx`

- [ ] **Step 1: Create the tasks page**

Create `apps/website/app/docs/tasks/page.tsx`:

```typescript
import { DocsCode, InlineCode } from "@/components/docs-code";

export const metadata = { title: "Tasks — Pingback Docs" };

export default function TasksPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
      <p className="text-muted-foreground mb-8">
        Define background tasks that are triggered via fan-out from cron jobs.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">API</h2>
      <DocsCode code={`task(name: string, handler: Function, options?: Options)`} />
      <div className="mt-4 space-y-2 text-sm text-muted-foreground">
        <p><InlineCode>name</InlineCode> — unique identifier for this task.</p>
        <p><InlineCode>handler</InlineCode> — async function receiving context and payload.</p>
        <p><InlineCode>options</InlineCode> — optional <InlineCode>retries</InlineCode>, <InlineCode>timeout</InlineCode>, <InlineCode>concurrency</InlineCode> (same as cron).</p>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Defining a Task</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Tasks are defined the same way as crons, but without a schedule. They receive
        a payload as the second argument:
      </p>
      <DocsCode code={`import { task } from "@pingback/next";

export const sendEmail = task(
  "send-email",
  async (ctx, { id }: { id: string }) => {
    const email = await getEmail(id);
    await deliver(email);
    ctx.log(\`Sent email to \${email.to}\`);
  },
  { retries: 2, timeout: "15s" }
);`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">Fan-Out Pattern</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Use <InlineCode>ctx.task()</InlineCode> inside a cron to dispatch independent sub-tasks.
        Each task runs with its own retries, timeout, and tracking:
      </p>
      <DocsCode code={`import { cron, task } from "@pingback/next";

// Parent cron — runs every 15 minutes
export const sendEmails = cron(
  "send-emails",
  "*/15 * * * *",
  async (ctx) => {
    const pending = await getPendingEmails();

    for (const email of pending) {
      await ctx.task("send-email", { id: email.id });
    }

    ctx.log(\`Dispatched \${pending.length} emails\`);
    return { dispatched: pending.length };
  }
);

// Child task — runs independently per email
export const sendEmail = task(
  "send-email",
  async (ctx, { id }: { id: string }) => {
    const email = await getEmail(id);
    await deliver(email);
    ctx.log(\`Sent email to \${email.to}\`);
  },
  { retries: 2, timeout: "15s" }
);`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">How Fan-Out Works</h2>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>1. The cron handler calls <InlineCode>ctx.task("send-email", payload)</InlineCode> which collects the task request in memory.</p>
        <p>2. When the cron handler finishes, the SDK returns the collected tasks in the response.</p>
        <p>3. The platform creates a child execution for each task, linked to the parent.</p>
        <p>4. Each child task is dispatched independently via the queue with its own retry policy.</p>
        <p>5. Child tasks appear nested under the parent execution in the dashboard.</p>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/app/docs/tasks/
git commit -m "feat(website): add Tasks docs page"
```

---

### Task 7: Context Object page

**Files:**
- Create: `apps/website/app/docs/context/page.tsx`

- [ ] **Step 1: Create the context page**

Create `apps/website/app/docs/context/page.tsx`:

```typescript
import { DocsCode, InlineCode } from "@/components/docs-code";

export const metadata = { title: "Context Object — Pingback Docs" };

export default function ContextPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Context Object</h1>
      <p className="text-muted-foreground mb-8">
        The <InlineCode>ctx</InlineCode> object is passed to every cron and task handler.
      </p>

      <div className="rounded-lg border overflow-hidden my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Property</th>
              <th className="text-left p-3 font-medium">Type</th>
              <th className="text-left p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b"><td className="p-3 font-mono">ctx.executionId</td><td className="p-3">string</td><td className="p-3">Unique ID for this execution</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">ctx.attempt</td><td className="p-3">number</td><td className="p-3">Current retry attempt (1-indexed)</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">ctx.scheduledAt</td><td className="p-3">Date</td><td className="p-3">When this run was scheduled</td></tr>
            <tr className="border-b"><td className="p-3 font-mono">ctx.log(message)</td><td className="p-3">(string) =&gt; void</td><td className="p-3">Add a structured log entry</td></tr>
            <tr><td className="p-3 font-mono">ctx.task(name, payload)</td><td className="p-3">(string, any) =&gt; Promise&lt;void&gt;</td><td className="p-3">Dispatch a child task</td></tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">ctx.executionId</h2>
      <p className="text-sm text-muted-foreground mb-2">
        A unique UUID for the current execution. Useful for correlating logs or
        building idempotency keys:
      </p>
      <DocsCode code={`export const processPayment = cron("process", "0 * * * *", async (ctx) => {
  await processWithKey(ctx.executionId);
});`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">ctx.attempt</h2>
      <p className="text-sm text-muted-foreground mb-2">
        The current retry attempt, starting at 1. Use it to adjust behavior on retries:
      </p>
      <DocsCode code={`export const syncData = cron("sync", "0 */6 * * *", async (ctx) => {
  if (ctx.attempt > 1) {
    ctx.log(\`Retry attempt \${ctx.attempt}\`);
  }
  await sync();
}, { retries: 3 });`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">ctx.log(message)</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Adds a structured log entry visible in the dashboard. Logs include timestamps
        and appear in the execution detail view:
      </p>
      <DocsCode code={`export const cleanup = cron("cleanup", "0 3 * * *", async (ctx) => {
  const expired = await getExpiredSessions();
  ctx.log(\`Found \${expired.length} expired sessions\`);

  await deleteAll(expired);
  ctx.log("Cleanup complete");
});`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">ctx.task(name, payload)</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Dispatches a child task for fan-out. The task is collected and dispatched
        after the parent handler completes. See the <a href="/docs/tasks" className="text-accent hover:underline">Tasks</a> page for details.
      </p>
      <DocsCode code={`export const sendEmails = cron("send-emails", "*/15 * * * *", async (ctx) => {
  const pending = await getPending();
  for (const item of pending) {
    await ctx.task("send-email", { id: item.id });
  }
});`} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/app/docs/context/
git commit -m "feat(website): add Context Object docs page"
```

---

### Task 8: Configuration page

**Files:**
- Create: `apps/website/app/docs/configuration/page.tsx`

- [ ] **Step 1: Create the configuration page**

Create `apps/website/app/docs/configuration/page.tsx`:

```typescript
import { DocsCode, InlineCode } from "@/components/docs-code";

export const metadata = { title: "Configuration — Pingback Docs" };

export default function ConfigurationPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Configuration</h1>
      <p className="text-muted-foreground mb-8">
        How to configure the Pingback SDK in your Next.js project.
      </p>

      <h2 className="text-xl font-semibold mt-10 mb-3">pingback.config.ts</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Create a <InlineCode>pingback.config.ts</InlineCode> file in your project root:
      </p>
      <DocsCode code={`import { defineConfig } from "@pingback/next";

export default defineConfig({
  apiKey: process.env.PINGBACK_API_KEY,
});`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">Environment Variables</h2>
      <div className="rounded-lg border overflow-hidden my-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 font-medium">Variable</th>
              <th className="text-left p-3 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="p-3 font-mono">PINGBACK_API_KEY</td>
              <td className="p-3">Your project API key. Found in the dashboard under API Keys.</td>
            </tr>
            <tr>
              <td className="p-3 font-mono">PINGBACK_CRON_SECRET</td>
              <td className="p-3">Request signing secret. Found in the dashboard under project Settings. Used to verify that incoming execution requests are from Pingback.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Next.js Plugin</h2>
      <p className="text-sm text-muted-foreground mb-2">
        The <InlineCode>withPingback()</InlineCode> function wraps your Next.js config. At build
        time, it scans your project for <InlineCode>cron()</InlineCode> and <InlineCode>task()</InlineCode> calls,
        collects their metadata, and registers them with the Pingback platform:
      </p>
      <DocsCode code={`import { withPingback } from "@pingback/next";

export default withPingback({
  // your existing Next.js config here
});`} />

      <h2 className="text-xl font-semibold mt-10 mb-3">Route Handler</h2>
      <p className="text-sm text-muted-foreground mb-2">
        The route handler receives execution requests from the Pingback platform.
        Create <InlineCode>app/api/__pingback/route.ts</InlineCode>:
      </p>
      <DocsCode code={`import { createRouteHandler } from "@pingback/next";

export const { POST } = createRouteHandler();`} />
      <p className="text-sm text-muted-foreground mt-2">
        The handler validates the HMAC signature using your <InlineCode>PINGBACK_CRON_SECRET</InlineCode>,
        looks up the requested function, executes it, and returns the result with logs.
      </p>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/app/docs/configuration/
git commit -m "feat(website): add Configuration docs page"
```
