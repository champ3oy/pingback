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
