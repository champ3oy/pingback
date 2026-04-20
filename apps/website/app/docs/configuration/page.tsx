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
