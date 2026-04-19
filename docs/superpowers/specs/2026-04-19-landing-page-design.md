# Landing Page — Design Spec

**Date:** 2026-04-19

---

## Overview

A single-page marketing site for Pingback at `apps/website`. Tailark-inspired visual style: white background, boxy grid lines, bordered sections, clean typography, no shadows or gradients.

## Tech Stack

- Next.js 15, React 19, TypeScript
- Tailwind CSS 4
- Shiki for code syntax highlighting (already in monorepo)
- Static page — no API calls, no auth

## Visual Style

**Grid lines & borders:** Thin light-gray borders (`border-border`) create a structured, boxy layout. A max-width container (~1200px) centered on the page. Outer vertical border lines running down both sides. Horizontal dividers between every section. Content within sections sits in bordered grid cells (2-col, 3-col). Cards use `border border-border rounded-lg` — no shadows, no colored backgrounds.

**Typography:** Large bold headlines (48-56px, `font-bold tracking-tight`). Body text in muted gray. Sans-serif matching the dashboard (Nunito).

**Color:** White background. Black text for headlines. Gray (`text-muted-foreground`) for secondary text. Black filled CTA buttons (`bg-foreground text-background rounded-full`). No gradients, no color splashes.

**Spacing:** Generous vertical padding between sections (`py-20` to `py-24`). Content breathes inside grid cells (`p-8` to `p-12`).

## File Structure

```
apps/website/
  app/
    layout.tsx        — html/body, font setup, metadata
    page.tsx          — imports and renders all sections
  components/
    navbar.tsx        — sticky nav bar
    hero.tsx          — headline + subtitle + CTA + code snippet
    features.tsx      — 2x2 feature grid
    workflow.tsx      — 3-step numbered workflow
    pricing.tsx       — 3-column pricing table
    cta.tsx           — final call to action
    footer.tsx        — link columns + copyright
  package.json
  tailwind.config.ts  — (or CSS config)
  tsconfig.json
  next.config.ts
```

## Sections

### 1. Navbar

Sticky top bar with horizontal border bottom. Contains:
- Left: Pingback logo/wordmark
- Center: nav links — Docs, Pricing (anchor scroll)
- Right: Login (text link to dashboard `/login`) + Get Started (filled black button to dashboard `/register`)

### 2. Hero

Centered layout within bordered container:
- Headline: **"Reliable cron jobs for modern web apps."**
- Subtitle: "Define scheduled functions in your Next.js codebase. Pingback handles scheduling, retries, and monitoring."
- Two buttons: "Get Started" (filled black, links to `/register`) + "Documentation" (outline, links to docs)
- Below buttons: a bordered card containing a code snippet showing `cron()` usage with Shiki syntax highlighting:

```ts
import { cron } from "@pingback/next";

export const sendEmails = cron(
  "send-emails",
  "*/15 * * * *",
  async (ctx) => {
    const pending = await getPendingEmails();
    for (const email of pending) {
      await ctx.task("send-email", { id: email.id });
    }
    ctx.log(`Processed ${pending.length} emails`);
    return { processed: pending.length };
  },
  { retries: 3, timeout: "60s" }
);
```

### 3. Features (2x2 bordered grid)

Four feature cards in a 2-column grid with visible border lines between cells:

| Card | Title | Description |
|------|-------|-------------|
| 1 | Automatic Retries | Configurable retry policies with exponential backoff. Jobs recover from transient failures without intervention. |
| 2 | Execution Logs | Structured logging via `ctx.log()`. Search and filter logs across all jobs in the dashboard. |
| 3 | Fan-Out Tasks | Spawn independent sub-tasks with `ctx.task()`. Each runs with its own retries, timeout, and tracking. |
| 4 | Real-Time Monitoring | Live execution status, duration tracking, and email alerts on failures. See every run in your dashboard. |

Each card: icon (Tabler icon), bold title, 1-2 sentence description in muted text.

### 4. Workflow (3-column numbered grid)

Section headline: **"Get started in 3 steps"**
Subtitle: "From install to monitoring in under 10 minutes."

Three bordered cells, numbered 01/02/03:

**01. Install**
```bash
npm install @pingback/next
```
Plus brief config snippet.

**02. Define**
Small code snippet showing a `cron()` function definition.

**03. Monitor**
"Deploy your app. Pingback discovers your functions, schedules them, and shows every execution in your dashboard."

### 5. Pricing (3-column bordered grid)

Section headline: **"Simple, predictable pricing"**

Three bordered cards:

**Free — $0/mo**
- 5 jobs
- 1,000 executions/month
- 1-minute minimum interval
- 24-hour log retention
- 1 project
- Email alerts
- CTA: "Get Started"

**Pro — $12/mo**
- 50 jobs
- 50,000 executions/month
- 10-second minimum interval
- 30-day log retention
- 5 projects
- Email + webhook alerts
- CTA: "Get Started"

**Team — $39/mo**
- Unlimited jobs
- 500,000 executions/month
- 10-second minimum interval
- 90-day log retention
- Unlimited projects
- Email + webhook alerts
- 10 team members
- Priority support
- CTA: "Get Started"

Pro card has a subtle highlight (e.g., slightly darker border or "Most Popular" badge).

### 6. Final CTA

Centered section within bordered container:
- Headline: **"Start running crons in under 10 minutes."**
- Subtitle: "No credit card required."
- "Get Started" button (filled black)

### 7. Footer

Bordered grid layout with 4 columns:
- **Pingback** — logo + one-line description: "Reliable cron jobs and background tasks for modern web apps."
- **Product** — Features, Pricing
- **Developers** — Documentation, GitHub
- **Company** — Twitter/X

Bottom row: "© 2026 Pingback. All rights reserved."
