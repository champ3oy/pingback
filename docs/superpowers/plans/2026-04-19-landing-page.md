# Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tailark-styled marketing landing page at `apps/website` with hero, features, workflow, pricing, CTA, and footer sections.

**Architecture:** New Next.js 15 app in the monorepo. Single-page static site with all sections as separate components. Light theme with boxy grid lines and bordered sections matching the Tailark template style. Shiki for code syntax highlighting in the hero.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 4, Shiki, Roboto Mono (matching dashboard font)

---

## File Structure

| File | Responsibility |
|------|---------------|
| `apps/website/package.json` | Dependencies and scripts |
| `apps/website/tsconfig.json` | TypeScript config with `@/*` path alias |
| `apps/website/next.config.ts` | Next.js config |
| `apps/website/postcss.config.mjs` | PostCSS with Tailwind |
| `apps/website/app/globals.css` | Tailwind imports + light theme CSS variables |
| `apps/website/app/layout.tsx` | Root layout with font, metadata |
| `apps/website/app/page.tsx` | Assembles all section components |
| `apps/website/components/navbar.tsx` | Sticky nav with logo + links + CTA buttons |
| `apps/website/components/hero.tsx` | Headline + subtitle + buttons + code snippet |
| `apps/website/components/features.tsx` | 2x2 bordered feature grid |
| `apps/website/components/workflow.tsx` | 3-step numbered workflow |
| `apps/website/components/pricing.tsx` | 3-column pricing table |
| `apps/website/components/cta.tsx` | Final call to action |
| `apps/website/components/footer.tsx` | Link columns + copyright |

---

### Task 1: Scaffold the website app

**Files:**
- Create: `apps/website/package.json`
- Create: `apps/website/tsconfig.json`
- Create: `apps/website/next.config.ts`
- Create: `apps/website/postcss.config.mjs`
- Create: `apps/website/app/globals.css`
- Create: `apps/website/app/layout.tsx`
- Create: `apps/website/app/page.tsx`

- [ ] **Step 1: Create package.json**

Create `apps/website/package.json`:

```json
{
  "name": "@pingback/website",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3100",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "shiki": "^4.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/node": "^20.0.0",
    "@types/react": "19.2.14",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.5.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `apps/website/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

Create `apps/website/next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create postcss.config.mjs**

Create `apps/website/postcss.config.mjs`:

```javascript
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

- [ ] **Step 5: Create globals.css with light theme**

Create `apps/website/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #0a0a0a;
  --muted: #f5f5f5;
  --muted-foreground: #737373;
  --border: #e5e5e5;
  --ring: #a3a3a3;
  --radius: 0.625rem;
}

@theme inline {
  --font-sans: var(--font-sans);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);
  --radius-lg: var(--radius);
}

* {
  border-color: var(--border);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 6: Create layout.tsx**

Create `apps/website/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Pingback — Reliable cron jobs for modern web apps",
  description:
    "Define scheduled functions in your Next.js codebase. Pingback handles scheduling, retries, and monitoring.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create placeholder page.tsx**

Create `apps/website/app/page.tsx`:

```typescript
export default function Home() {
  return (
    <main>
      <p className="p-8 text-muted-foreground">Pingback landing page</p>
    </main>
  );
}
```

- [ ] **Step 8: Install dependencies and verify**

Run: `cd apps/website && npm install && npm run dev -- &` then after a few seconds `curl -s http://localhost:3100 | head -5` to verify it serves. Kill the dev server afterward.

- [ ] **Step 9: Commit**

```bash
git add apps/website
git commit -m "feat(website): scaffold Next.js landing page app"
```

---

### Task 2: Navbar

**Files:**
- Create: `apps/website/components/navbar.tsx`

- [ ] **Step 1: Create the navbar component**

Create `apps/website/components/navbar.tsx`:

```typescript
import Link from "next/link";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Pingback
        </Link>

        <nav className="flex items-center gap-6">
          <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </a>
          <Link href="https://docs.pingback.dev" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Docs
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="https://app.pingback.dev/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
          <Link
            href="https://app.pingback.dev/register"
            className="text-sm bg-foreground text-background px-4 py-1.5 rounded-full hover:opacity-90 transition-opacity"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/components/navbar.tsx
git commit -m "feat(website): add navbar component"
```

---

### Task 3: Hero with code snippet

**Files:**
- Create: `apps/website/components/hero.tsx`

- [ ] **Step 1: Create the hero component**

Create `apps/website/components/hero.tsx`:

```typescript
import Link from "next/link";
import { CodeSnippet } from "./code-snippet";

export function Hero() {
  return (
    <section className="border-b">
      <div className="max-w-5xl mx-auto border-x">
        <div className="py-24 px-6 text-center">
          <h1 className="text-5xl font-bold tracking-tight leading-[1.1] mb-4">
            Reliable cron jobs for
            <br />
            modern web apps.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Define scheduled functions in your Next.js codebase. Pingback handles
            scheduling, retries, and monitoring.
          </p>
          <div className="flex items-center justify-center gap-3 mb-16">
            <Link
              href="https://app.pingback.dev/register"
              className="bg-foreground text-background px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              href="https://docs.pingback.dev"
              className="border px-6 py-2.5 rounded-full text-sm font-medium hover:bg-muted transition-colors"
            >
              Documentation
            </Link>
          </div>
        </div>
        <div className="border-t px-6 py-8">
          <CodeSnippet />
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the code snippet component**

Create `apps/website/components/code-snippet.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";

const CODE = `import { cron } from "@pingback/next";

export const sendEmails = cron(
  "send-emails",
  "*/15 * * * *",
  async (ctx) => {
    const pending = await getPendingEmails();
    for (const email of pending) {
      await ctx.task("send-email", { id: email.id });
    }
    ctx.log(\`Processed \${pending.length} emails\`);
    return { processed: pending.length };
  },
  { retries: 3, timeout: "60s" }
);`;

export function CodeSnippet() {
  const [html, setHtml] = useState("");

  useEffect(() => {
    codeToHtml(CODE, {
      lang: "typescript",
      theme: "github-dark",
    }).then(setHtml);
  }, []);

  return (
    <div className="rounded-lg border bg-[#0d1117] p-6 overflow-auto">
      {html ? (
        <div
          className="[&_pre]:!bg-transparent [&_pre]:!p-0 [&_pre]:!m-0 [&_pre]:!text-sm [&_pre]:!leading-6 [&_code]:!text-sm [&_code]:!leading-6"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="text-sm leading-6 font-mono text-gray-400">
          <code>{CODE}</code>
        </pre>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/website/components/hero.tsx apps/website/components/code-snippet.tsx
git commit -m "feat(website): add hero section with code snippet"
```

---

### Task 4: Features grid

**Files:**
- Create: `apps/website/components/features.tsx`

- [ ] **Step 1: Create the features component**

Create `apps/website/components/features.tsx`:

```typescript
const features = [
  {
    title: "Automatic Retries",
    description:
      "Configurable retry policies with exponential backoff. Jobs recover from transient failures without intervention.",
  },
  {
    title: "Execution Logs",
    description:
      "Structured logging via ctx.log(). Search and filter logs across all jobs in the dashboard.",
  },
  {
    title: "Fan-Out Tasks",
    description:
      "Spawn independent sub-tasks with ctx.task(). Each runs with its own retries, timeout, and tracking.",
  },
  {
    title: "Real-Time Monitoring",
    description:
      "Live execution status, duration tracking, and email alerts on failures. See every run in your dashboard.",
  },
];

export function Features() {
  return (
    <section className="border-b">
      <div className="max-w-5xl mx-auto border-x">
        <div className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Everything you need for reliable background jobs
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Built for developers who need more than a basic cron scheduler.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 border-t">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`p-8 ${i % 2 === 0 ? "md:border-r" : ""} ${i < 2 ? "border-b" : ""}`}
            >
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/components/features.tsx
git commit -m "feat(website): add features grid section"
```

---

### Task 5: Workflow section

**Files:**
- Create: `apps/website/components/workflow.tsx`

- [ ] **Step 1: Create the workflow component**

Create `apps/website/components/workflow.tsx`:

```typescript
const steps = [
  {
    number: "01",
    title: "Install",
    content: (
      <div className="mt-4 rounded-lg border bg-[#0d1117] px-4 py-3">
        <code className="text-sm text-gray-300 font-mono">
          npm install @pingback/next
        </code>
      </div>
    ),
  },
  {
    number: "02",
    title: "Define",
    content: (
      <div className="mt-4 rounded-lg border bg-[#0d1117] px-4 py-3 overflow-auto">
        <pre className="text-sm text-gray-300 font-mono leading-6">{`import { cron } from "@pingback/next";

export const cleanup = cron(
  "cleanup",
  "0 3 * * *",
  async (ctx) => {
    await removeExpiredSessions();
    ctx.log("Sessions cleaned");
  }
);`}</pre>
      </div>
    ),
  },
  {
    number: "03",
    title: "Monitor",
    content: (
      <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
        Deploy your app. Pingback discovers your functions, schedules them, and
        shows every execution in your dashboard — status, duration, logs, and
        errors.
      </p>
    ),
  },
];

export function Workflow() {
  return (
    <section className="border-b">
      <div className="max-w-5xl mx-auto border-x">
        <div className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Get started in 3 steps
          </h2>
          <p className="text-muted-foreground">
            From install to monitoring in under 10 minutes.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border-t">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`p-8 ${i < 2 ? "md:border-r" : ""} border-b md:border-b-0`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground font-mono">
                  {step.number}.
                </span>
                <span className="text-xs text-muted-foreground">
                  {step.title}
                </span>
              </div>
              {step.content}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/components/workflow.tsx
git commit -m "feat(website): add 3-step workflow section"
```

---

### Task 6: Pricing section

**Files:**
- Create: `apps/website/components/pricing.tsx`

- [ ] **Step 1: Create the pricing component**

Create `apps/website/components/pricing.tsx`:

```typescript
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    price: "$0",
    description: "For side projects and experimentation.",
    features: [
      "5 jobs",
      "1,000 executions / month",
      "1-minute minimum interval",
      "24-hour log retention",
      "1 project",
      "Email alerts",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    description: "For production apps that need reliability.",
    features: [
      "50 jobs",
      "50,000 executions / month",
      "10-second minimum interval",
      "30-day log retention",
      "5 projects",
      "Email + webhook alerts",
    ],
    highlight: true,
  },
  {
    name: "Team",
    price: "$39",
    description: "For teams managing multiple projects.",
    features: [
      "Unlimited jobs",
      "500,000 executions / month",
      "10-second minimum interval",
      "90-day log retention",
      "Unlimited projects",
      "Email + webhook alerts",
      "10 team members",
      "Priority support",
    ],
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="border-b">
      <div className="max-w-5xl mx-auto border-x">
        <div className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">
            Simple, predictable pricing
          </h2>
          <p className="text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 border-t">
          {tiers.map((tier, i) => (
            <div
              key={tier.name}
              className={`p-8 flex flex-col ${i < 2 ? "md:border-r" : ""} border-b md:border-b-0 ${
                tier.highlight ? "bg-muted/30" : ""
              }`}
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  {tier.highlight && (
                    <span className="text-[10px] font-medium bg-foreground text-background px-2 py-0.5 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">/mo</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {tier.description}
                </p>
              </div>
              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li
                    key={feature}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <svg
                      className="h-4 w-4 text-foreground shrink-0 mt-0.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="https://app.pingback.dev/register"
                className={`text-sm font-medium text-center py-2.5 rounded-full transition-opacity ${
                  tier.highlight
                    ? "bg-foreground text-background hover:opacity-90"
                    : "border hover:bg-muted"
                }`}
              >
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/website/components/pricing.tsx
git commit -m "feat(website): add pricing section"
```

---

### Task 7: CTA and Footer

**Files:**
- Create: `apps/website/components/cta.tsx`
- Create: `apps/website/components/footer.tsx`

- [ ] **Step 1: Create the CTA component**

Create `apps/website/components/cta.tsx`:

```typescript
import Link from "next/link";

export function CTA() {
  return (
    <section className="border-b">
      <div className="max-w-5xl mx-auto border-x py-24 px-6 text-center">
        <h2 className="text-3xl font-bold tracking-tight mb-3">
          Start running crons in under 10 minutes.
        </h2>
        <p className="text-muted-foreground mb-8">No credit card required.</p>
        <Link
          href="https://app.pingback.dev/register"
          className="bg-foreground text-background px-8 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity inline-block"
        >
          Get Started
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create the footer component**

Create `apps/website/components/footer.tsx`:

```typescript
import Link from "next/link";

const links = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
  ],
  Developers: [
    { label: "Documentation", href: "https://docs.pingback.dev" },
    { label: "GitHub", href: "https://github.com/pingback" },
  ],
  Company: [
    { label: "Twitter / X", href: "https://x.com/pingback" },
  ],
};

export function Footer() {
  return (
    <footer>
      <div className="max-w-5xl mx-auto border-x">
        <div className="grid grid-cols-2 md:grid-cols-4 border-t">
          <div className="p-8 col-span-2 md:col-span-1 md:border-r border-b md:border-b-0">
            <p className="text-lg font-semibold mb-2">Pingback</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Reliable cron jobs and background tasks for modern web apps.
            </p>
          </div>
          {Object.entries(links).map(([category, items], i) => (
            <div
              key={category}
              className={`p-8 ${i < 2 ? "md:border-r" : ""} border-b md:border-b-0`}
            >
              <p className="text-sm font-semibold mb-3">{category}</p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t px-8 py-4">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()} Pingback. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/website/components/cta.tsx apps/website/components/footer.tsx
git commit -m "feat(website): add CTA and footer sections"
```

---

### Task 8: Assemble the page

**Files:**
- Modify: `apps/website/app/page.tsx`

- [ ] **Step 1: Wire up all sections in page.tsx**

Replace the entire contents of `apps/website/app/page.tsx` with:

```typescript
import { Navbar } from "@/components/navbar";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Workflow } from "@/components/workflow";
import { Pricing } from "@/components/pricing";
import { CTA } from "@/components/cta";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <Features />
        <Workflow />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
```

- [ ] **Step 2: Verify the page builds**

Run: `cd apps/website && npm run build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add apps/website/app/page.tsx
git commit -m "feat(website): assemble all sections on landing page"
```
