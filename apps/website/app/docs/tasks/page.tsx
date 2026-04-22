import { DocsCode, InlineCode } from "@/components/docs-code";
import { FrameworkSwitcher } from "@/components/framework-switcher";

export const metadata = { title: "Tasks — Pingback Docs" };

export default function TasksPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-2">Tasks</h1>
      <p className="text-muted-foreground mb-8">
        Define background tasks that are triggered via fan-out, programmatically
        from your code, or manually from the dashboard.
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
      <FrameworkSwitcher>
        {{
          next: (
            <DocsCode code={`import { task } from "@usepingback/next";

export const sendEmail = task(
  "send-email",
  async (ctx, { id }: { id: string }) => {
    const email = await getEmail(id);
    await deliver(email);
    ctx.log(\`Sent email to \${email.to}\`);
  },
  { retries: 2, timeout: "15s" }
);`} />
          ),
        }}
      </FrameworkSwitcher>

      <h2 className="text-xl font-semibold mt-10 mb-3">Fan-Out Pattern</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Use <InlineCode>ctx.task()</InlineCode> inside a cron to dispatch independent sub-tasks.
        Each task runs with its own retries, timeout, and tracking:
      </p>
      <FrameworkSwitcher>
        {{
          next: (
            <DocsCode code={`import { cron, task } from "@usepingback/next";

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
          ),
        }}
      </FrameworkSwitcher>

      <h2 className="text-xl font-semibold mt-10 mb-3">How Fan-Out Works</h2>
      <div className="text-sm text-muted-foreground space-y-2">
        <p>1. The cron handler calls <InlineCode>ctx.task("send-email", payload)</InlineCode> which collects the task request in memory.</p>
        <p>2. When the cron handler finishes, the SDK returns the collected tasks in the response.</p>
        <p>3. The platform creates a child execution for each task, linked to the parent.</p>
        <p>4. Each child task is dispatched independently via the queue with its own retry policy.</p>
        <p>5. Child tasks appear nested under the parent execution in the dashboard.</p>
      </div>

      <h2 className="text-xl font-semibold mt-10 mb-3">Programmatic Triggering</h2>
      <p className="text-sm text-muted-foreground mb-2">
        Use <InlineCode>PingbackClient</InlineCode> to trigger tasks from your own code —
        no cron schedule or fan-out required. This is useful for event-driven workflows
        like sending a welcome email after signup, processing a webhook, or kicking off
        a pipeline from an API route.
      </p>
      <FrameworkSwitcher>
        {{
          next: (
            <DocsCode code={`import { PingbackClient } from "@usepingback/next";

const pingback = new PingbackClient({
  apiKey: process.env.PINGBACK_API_KEY!,
});

// Trigger a task from anywhere in your app
const { executionId } = await pingback.trigger("send-email", {
  to: "user@example.com",
  subject: "Welcome!",
});

console.log("Triggered execution:", executionId);`} />
          ),
        }}
      </FrameworkSwitcher>

      <h3 className="text-lg font-semibold mt-8 mb-3">NestJS</h3>
      <p className="text-sm text-muted-foreground mb-2">
        In NestJS, <InlineCode>PingbackClient</InlineCode> is an injectable service —
        just add it to your constructor:
      </p>
      <DocsCode code={`import { Injectable } from '@nestjs/common';
import { PingbackClient } from '@usepingback/nestjs';

@Injectable()
export class AuthService {
  constructor(private readonly pingback: PingbackClient) {}

  async register(email: string, password: string) {
    const user = await this.createUser(email, password);

    // Trigger the onboarding email task
    const { executionId } = await this.pingback.trigger(
      "send-onboarding-email",
      { userId: user.id },
    );

    return user;
  }
}`} />

      <h3 className="text-lg font-semibold mt-8 mb-3">API Reference</h3>
      <DocsCode code={`const client = new PingbackClient(options);
const { executionId } = await client.trigger(taskName, payload?);`} />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="pb-2 pr-4 font-medium">Parameter</th>
              <th className="pb-2 pr-4 font-medium">Type</th>
              <th className="pb-2 font-medium">Description</th>
            </tr>
          </thead>
          <tbody className="text-muted-foreground">
            <tr className="border-b">
              <td className="py-2 pr-4"><InlineCode>options.apiKey</InlineCode></td>
              <td className="py-2 pr-4"><InlineCode>string</InlineCode></td>
              <td className="py-2">Your Pingback API key.</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4"><InlineCode>options.platformUrl</InlineCode></td>
              <td className="py-2 pr-4"><InlineCode>string?</InlineCode></td>
              <td className="py-2">Defaults to <InlineCode>https://api.pingback.lol</InlineCode>.</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4"><InlineCode>taskName</InlineCode></td>
              <td className="py-2 pr-4"><InlineCode>string</InlineCode></td>
              <td className="py-2">Name of a registered task in your project.</td>
            </tr>
            <tr className="border-b">
              <td className="py-2 pr-4"><InlineCode>payload</InlineCode></td>
              <td className="py-2 pr-4"><InlineCode>any?</InlineCode></td>
              <td className="py-2">Optional JSON payload passed to the task handler.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="text-sm text-muted-foreground mt-3">
        Returns <InlineCode>{`{ executionId: string }`}</InlineCode>. Throws if the
        task name doesn{"'"}t exist in your project or the API key is invalid.
      </p>

      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 mt-6">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Tasks can also be triggered
          manually from the Pingback dashboard. Navigate to your task in the dashboard
          and click {'"'}Run{'"'} to dispatch it with a custom payload — useful for testing and
          one-off executions.
        </p>
      </div>
    </>
  );
}
