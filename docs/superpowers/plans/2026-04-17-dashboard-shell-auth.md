# Dashboard Shell & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dashboard shell — Next.js app with sidebar layout, authentication, project management, API key management, and placeholder pages for future data views.

**Architecture:** Next.js 15 App Router with route groups: `(auth)` for login/register (no sidebar), `(dashboard)` for all authenticated pages (sidebar layout). All dashboard pages scoped under `[projectId]`. Custom JWT auth with httpOnly cookies. React Query for interactive data fetching.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS 4, shadcn/ui, React Query (TanStack Query), Lucide icons

---

## File Map

### Task 1 — App scaffold + theming
- `apps/dashboard/package.json`
- `apps/dashboard/tsconfig.json`
- `apps/dashboard/next.config.ts`
- `apps/dashboard/tailwind.config.ts`
- `apps/dashboard/postcss.config.js`
- `apps/dashboard/app/globals.css`
- `apps/dashboard/app/layout.tsx`
- `apps/dashboard/.env.local`

### Task 2 — shadcn/ui setup + components
- `apps/dashboard/components.json`
- `apps/dashboard/lib/utils.ts`
- `apps/dashboard/components/ui/*.tsx` (button, input, label, card, dialog, table, dropdown-menu, badge, separator, avatar, skeleton, toast, sonner)

### Task 3 — Auth library (API client + token management)
- `apps/dashboard/lib/api.ts`
- `apps/dashboard/lib/auth.ts`
- `apps/dashboard/app/actions/auth.ts` (server actions for cookie management)
- `apps/dashboard/middleware.ts`

### Task 4 — Auth pages (login + register + callback)
- `apps/dashboard/app/(auth)/layout.tsx`
- `apps/dashboard/app/(auth)/login/page.tsx`
- `apps/dashboard/app/(auth)/register/page.tsx`
- `apps/dashboard/app/(auth)/auth/callback/page.tsx`

### Task 5 — Dashboard layout + sidebar
- `apps/dashboard/app/(dashboard)/layout.tsx`
- `apps/dashboard/components/sidebar.tsx`
- `apps/dashboard/components/project-switcher.tsx`
- `apps/dashboard/components/user-menu.tsx`
- `apps/dashboard/lib/hooks/use-projects.ts`
- `apps/dashboard/lib/providers.tsx` (React Query provider)

### Task 6 — Projects page
- `apps/dashboard/app/(dashboard)/projects/page.tsx`
- `apps/dashboard/components/create-project-dialog.tsx`

### Task 7 — Placeholder pages + empty state
- `apps/dashboard/components/empty-state.tsx`
- `apps/dashboard/app/(dashboard)/[projectId]/crons/page.tsx`
- `apps/dashboard/app/(dashboard)/[projectId]/tasks/page.tsx`
- `apps/dashboard/app/(dashboard)/[projectId]/runs/page.tsx`
- `apps/dashboard/app/(dashboard)/[projectId]/logs/page.tsx`
- `apps/dashboard/app/(dashboard)/[projectId]/alerts/page.tsx`

### Task 8 — API Keys page
- `apps/dashboard/app/(dashboard)/[projectId]/api-keys/page.tsx`
- `apps/dashboard/components/create-api-key-dialog.tsx`
- `apps/dashboard/components/api-key-created-dialog.tsx`
- `apps/dashboard/lib/hooks/use-api-keys.ts`

### Task 9 — Project settings page
- `apps/dashboard/app/(dashboard)/[projectId]/settings/page.tsx`
- Modify: `apps/platform/src/modules/projects/projects.service.ts` (include cronSecret in findOneByUser)

---

## Task 1: App Scaffold + Theming

**Files:**
- Create: `apps/dashboard/package.json`
- Create: `apps/dashboard/tsconfig.json`
- Create: `apps/dashboard/next.config.ts`
- Create: `apps/dashboard/postcss.config.js`
- Create: `apps/dashboard/app/globals.css`
- Create: `apps/dashboard/app/layout.tsx`
- Create: `apps/dashboard/.env.local`

- [ ] **Step 1: Create package.json**

Create `apps/dashboard/package.json`:
```json
{
  "name": "@pingback/dashboard",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@tanstack/react-query": "^5.60.0",
    "lucide-react": "^0.460.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0",
    "sonner": "^1.7.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "tailwindcss": "^4.0.0",
    "@tailwindcss/postcss": "^4.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

Create `apps/dashboard/tsconfig.json`:
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

Create `apps/dashboard/next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

- [ ] **Step 4: Create postcss.config.js**

Create `apps/dashboard/postcss.config.js`:
```js
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

- [ ] **Step 5: Create globals.css with pure black theme**

Create `apps/dashboard/app/globals.css`:
```css
@import "tailwindcss";

:root {
  --background: #000000;
  --foreground: #ffffff;
  --surface: #0a0a0a;
  --border: #1a1a1a;
  --border-hover: #2a2a2a;
  --text-secondary: #a1a1a1;
  --text-muted: #666666;
  --text-disabled: #444444;
  --accent: #3b82f6;
  --success: #22c55e;
  --error: #ef4444;
  --warning: #eab308;
  --nav-active: #111111;
  --nav-hover: #0a0a0a;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

* {
  border-color: var(--border);
}
```

- [ ] **Step 6: Create root layout**

Create `apps/dashboard/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pingback",
  description: "Cron jobs and background tasks for modern web apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 7: Create .env.local**

Create `apps/dashboard/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 8: Install dependencies**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback && npm install`

- [ ] **Step 9: Verify app starts**

Run: `cd apps/dashboard && npm run dev`
Expected: App starts on http://localhost:3000 with a black page.

- [ ] **Step 10: Commit**

```bash
git add apps/dashboard/
git commit -m "chore: scaffold dashboard app with Next.js 15 and pure black theme"
```

---

## Task 2: shadcn/ui Setup + Components

**Files:**
- Create: `apps/dashboard/components.json`
- Create: `apps/dashboard/lib/utils.ts`
- Create: `apps/dashboard/components/ui/*.tsx`

- [ ] **Step 1: Create lib/utils.ts (required by shadcn)**

Create `apps/dashboard/lib/utils.ts`:
```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 2: Initialize shadcn/ui**

Run: `cd apps/dashboard && npx shadcn@latest init`

When prompted:
- Style: Default
- Base color: Neutral
- CSS variables: Yes
- Use `--prefix`: No

If `shadcn init` asks about overwriting globals.css, choose to keep your existing file and merge manually.

- [ ] **Step 3: Install shadcn components**

Run these one by one:
```bash
cd apps/dashboard
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add table
npx shadcn@latest add dropdown-menu
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add avatar
npx shadcn@latest add skeleton
npx shadcn@latest add sonner
```

- [ ] **Step 4: Override shadcn theme to pure black**

After shadcn init, it will have modified `globals.css` with its own CSS variables. Update the dark theme variables to match our design tokens. The key overrides in `globals.css` (merge with what shadcn generated):

```css
.dark {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --card: 0 0% 4%;
  --card-foreground: 0 0% 100%;
  --popover: 0 0% 4%;
  --popover-foreground: 0 0% 100%;
  --primary: 217 91% 60%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 7%;
  --secondary-foreground: 0 0% 100%;
  --muted: 0 0% 7%;
  --muted-foreground: 0 0% 63%;
  --accent: 0 0% 7%;
  --accent-foreground: 0 0% 100%;
  --destructive: 0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 10%;
  --input: 0 0% 10%;
  --ring: 217 91% 60%;
}
```

- [ ] **Step 5: Verify components render**

Create a temporary test in `app/page.tsx`:
```tsx
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Pingback Dashboard</h1>
      <Button>Test Button</Button>
    </div>
  );
}
```

Run: `cd apps/dashboard && npm run dev`
Expected: Black page with white text and a styled button.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): add shadcn/ui components with pure black theme"
```

---

## Task 3: Auth Library

**Files:**
- Create: `apps/dashboard/lib/api.ts`
- Create: `apps/dashboard/lib/auth.ts`
- Create: `apps/dashboard/app/actions/auth.ts`
- Create: `apps/dashboard/middleware.ts`

- [ ] **Step 1: Create server actions for cookie management**

Create `apps/dashboard/app/actions/auth.ts`:
```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setTokens(accessToken: string, refreshToken: string) {
  const cookieStore = await cookies();

  cookieStore.set("pingback_access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 15, // 15 minutes
  });

  cookieStore.set("pingback_refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function clearTokens() {
  const cookieStore = await cookies();
  cookieStore.delete("pingback_access_token");
  cookieStore.delete("pingback_refresh_token");
  redirect("/login");
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("pingback_access_token")?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("pingback_refresh_token")?.value;
}
```

- [ ] **Step 2: Create auth helpers**

Create `apps/dashboard/lib/auth.ts`:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function loginWithCredentials(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Login failed" }));
    throw new Error(error.message || "Invalid credentials");
  }

  return res.json() as Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

export async function registerWithCredentials(
  email: string,
  password: string,
  name?: string
) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Registration failed" }));
    throw new Error(error.message || "Registration failed");
  }

  return res.json() as Promise<{
    accessToken: string;
    refreshToken: string;
  }>;
}

export function getGithubAuthUrl() {
  return `${API_URL}/auth/github`;
}
```

- [ ] **Step 3: Create API client with auto-refresh**

Create `apps/dashboard/lib/api.ts`:
```typescript
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/app/actions/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  const accessToken = await getAccessToken();
  if (!refreshToken || !accessToken) return null;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    await setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  let token = await getAccessToken();

  const makeRequest = (authToken: string) =>
    fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      },
    });

  let res = await makeRequest(token || "");

  if (res.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await makeRequest(newToken);
    } else {
      await clearTokens();
    }
  }

  return res;
}

export const apiClient = {
  async get<T>(path: string): Promise<T> {
    const res = await fetchWithAuth(path);
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `GET ${path} failed (${res.status})`);
    }
    return res.json();
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithAuth(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `POST ${path} failed (${res.status})`);
    }
    return res.json();
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetchWithAuth(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `PATCH ${path} failed (${res.status})`);
    }
    return res.json();
  },

  async delete(path: string): Promise<void> {
    const res = await fetchWithAuth(path, { method: "DELETE" });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `DELETE ${path} failed (${res.status})`);
    }
  },
};
```

- [ ] **Step 4: Create auth middleware**

Create `apps/dashboard/middleware.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("pingback_access_token")?.value;
  const { pathname } = request.nextUrl;

  // Auth pages — redirect to dashboard if already logged in
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    if (token) {
      return NextResponse.redirect(new URL("/projects", request.url));
    }
    return NextResponse.next();
  }

  // OAuth callback — always allow
  if (pathname.startsWith("/auth/callback")) {
    return NextResponse.next();
  }

  // Dashboard pages — require auth
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
```

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/lib/ apps/dashboard/app/actions/ apps/dashboard/middleware.ts
git commit -m "feat(dashboard): add auth library with API client, token management, and middleware"
```

---

## Task 4: Auth Pages

**Files:**
- Create: `apps/dashboard/app/(auth)/layout.tsx`
- Create: `apps/dashboard/app/(auth)/login/page.tsx`
- Create: `apps/dashboard/app/(auth)/register/page.tsx`
- Create: `apps/dashboard/app/(auth)/auth/callback/page.tsx`

- [ ] **Step 1: Create auth layout (centered, no sidebar)**

Create `apps/dashboard/app/(auth)/layout.tsx`:
```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create login page**

Create `apps/dashboard/app/(auth)/login/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { loginWithCredentials, getGithubAuthUrl } from "@/lib/auth";
import { setTokens } from "@/app/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokens = await loginWithCredentials(email, password);
      await setTokens(tokens.accessToken, tokens.refreshToken);
      router.push("/projects");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Pingback</CardTitle>
        <p className="text-[var(--text-secondary)] text-sm">
          Sign in to your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-[var(--error)] text-center">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-[var(--text-muted)]">or</span>
          <Separator className="flex-1" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => (window.location.href = getGithubAuthUrl())}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </Button>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Register
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create register page**

Create `apps/dashboard/app/(auth)/register/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { registerWithCredentials, getGithubAuthUrl } from "@/lib/auth";
import { setTokens } from "@/app/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const tokens = await registerWithCredentials(email, password, name || undefined);
      await setTokens(tokens.accessToken, tokens.refreshToken);
      router.push("/projects");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-[var(--surface)] border-[var(--border)]">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Pingback</CardTitle>
        <p className="text-[var(--text-secondary)] text-sm">
          Create your account
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p className="text-sm text-[var(--error)] text-center">{error}</p>
          )}
          <div className="space-y-2">
            <Label htmlFor="name">Name (optional)</Label>
            <Input
              id="name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Min 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-[var(--text-muted)]">or</span>
          <Separator className="flex-1" />
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={() => (window.location.href = getGithubAuthUrl())}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign in with GitHub
        </Button>

        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Already have an account?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 4: Create GitHub OAuth callback page**

Create `apps/dashboard/app/(auth)/auth/callback/page.tsx`:
```tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setTokens } from "@/app/actions/auth";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken");

    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken).then(() => {
        router.push("/projects");
      });
    } else {
      router.push("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-[var(--text-secondary)]">Signing you in...</p>
    </div>
  );
}
```

- [ ] **Step 5: Verify auth pages render**

Run: `cd apps/dashboard && npm run dev`
Visit: http://localhost:3000/login and http://localhost:3000/register
Expected: Centered cards on black background with form fields and buttons.

- [ ] **Step 6: Commit**

```bash
git add apps/dashboard/app/\(auth\)/
git commit -m "feat(dashboard): add login, register, and GitHub OAuth callback pages"
```

---

## Task 5: Dashboard Layout + Sidebar

**Files:**
- Create: `apps/dashboard/lib/providers.tsx`
- Create: `apps/dashboard/lib/hooks/use-projects.ts`
- Create: `apps/dashboard/components/sidebar.tsx`
- Create: `apps/dashboard/components/project-switcher.tsx`
- Create: `apps/dashboard/components/user-menu.tsx`
- Create: `apps/dashboard/app/(dashboard)/layout.tsx`
- Modify: `apps/dashboard/app/layout.tsx` (add providers)

- [ ] **Step 1: Create React Query provider**

Create `apps/dashboard/lib/providers.tsx`:
```tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster theme="dark" />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 2: Wrap root layout with providers**

Update `apps/dashboard/app/layout.tsx` to wrap children with `<Providers>`:
```tsx
import type { Metadata } from "next";
import { Providers } from "@/lib/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pingback",
  description: "Cron jobs and background tasks for modern web apps",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create useProjects hook**

Create `apps/dashboard/lib/hooks/use-projects.ts`:
```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface Project {
  id: string;
  name: string;
  endpointUrl: string;
  domain?: string;
  cronSecret?: string;
  createdAt: string;
  updatedAt: string;
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: () => apiClient.get<Project[]>("/api/v1/projects"),
  });
}

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => apiClient.get<Project>(`/api/v1/projects/${projectId}`),
    enabled: !!projectId,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; endpointUrl: string; domain?: string }) =>
      apiClient.post<Project>("/api/v1/projects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.delete(`/api/v1/projects/${projectId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
```

- [ ] **Step 4: Create sidebar component**

Create `apps/dashboard/components/sidebar.tsx`:
```tsx
"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import {
  Clock,
  ListChecks,
  Play,
  Terminal,
  Key,
  Bell,
  FolderOpen,
} from "lucide-react";
import { ProjectSwitcher } from "./project-switcher";
import { UserMenu } from "./user-menu";
import { cn } from "@/lib/utils";

const projectNav = [
  { name: "Crons", href: "crons", icon: Clock },
  { name: "Tasks", href: "tasks", icon: ListChecks },
  { name: "Runs", href: "runs", icon: Play },
  { name: "Logs", href: "logs", icon: Terminal },
  { name: "API Keys", href: "api-keys", icon: Key },
  { name: "Alerts", href: "alerts", icon: Bell },
];

const accountNav = [
  { name: "Projects", href: "/projects", icon: FolderOpen },
];

export function Sidebar() {
  const params = useParams();
  const pathname = usePathname();
  const projectId = params.projectId as string;

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[var(--border)] flex flex-col bg-black">
      <div className="p-3 border-b border-[var(--border)]">
        <ProjectSwitcher />
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {projectId && (
          <div className="mb-4">
            <p className="px-3 mb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
              Project
            </p>
            {projectNav.map((item) => {
              const href = `/${projectId}/${item.href}`;
              const isActive = pathname === href;
              return (
                <Link
                  key={item.name}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "text-white bg-[var(--nav-active)] border-l-2 border-[var(--accent)]"
                      : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--nav-hover)]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}

        <div>
          <p className="px-3 mb-1 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
            Account
          </p>
          {accountNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "text-white bg-[var(--nav-active)] border-l-2 border-[var(--accent)]"
                    : "text-[var(--text-secondary)] hover:text-white hover:bg-[var(--nav-hover)]"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[var(--border)] p-3">
        <UserMenu />
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Create project switcher**

Create `apps/dashboard/components/project-switcher.tsx`:
```tsx
"use client";

import { useRouter, useParams } from "next/navigation";
import { ChevronsUpDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/hooks/use-projects";

export function ProjectSwitcher() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: projects } = useProjects();

  const currentProject = projects?.find((p) => p.id === projectId);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between text-left font-normal h-auto py-1.5"
        >
          <span className="truncate text-sm">
            {currentProject?.name || "Select project"}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 text-[var(--text-muted)]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {projects?.map((project) => (
          <DropdownMenuItem
            key={project.id}
            onClick={() => router.push(`/${project.id}/crons`)}
            className={project.id === projectId ? "bg-[var(--nav-active)]" : ""}
          >
            {project.name}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/projects")}>
          <Plus className="mr-2 h-4 w-4" />
          Create new project
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 6: Create user menu**

Create `apps/dashboard/components/user-menu.tsx`:
```tsx
"use client";

import { LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { clearTokens } from "@/app/actions/auth";

export function UserMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-[var(--nav-hover)] transition-colors">
        <Avatar className="h-6 w-6">
          <AvatarFallback className="bg-[var(--accent)] text-white text-xs">
            P
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-[var(--text-secondary)] truncate">
          Account
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => clearTokens()}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

- [ ] **Step 7: Create dashboard layout**

Create `apps/dashboard/app/(dashboard)/layout.tsx`:
```tsx
import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-60 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 8: Verify layout renders**

Run: `cd apps/dashboard && npm run dev`
Visit: http://localhost:3000 (should redirect to /login since not authenticated)
Expected: Login page centered. After login, sidebar visible with navigation.

- [ ] **Step 9: Commit**

```bash
git add apps/dashboard/
git commit -m "feat(dashboard): add sidebar layout with project switcher and user menu"
```

---

## Task 6: Projects Page

**Files:**
- Create: `apps/dashboard/app/(dashboard)/projects/page.tsx`
- Create: `apps/dashboard/components/create-project-dialog.tsx`

- [ ] **Step 1: Create project dialog**

Create `apps/dashboard/components/create-project-dialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCreateProject } from "@/lib/hooks/use-projects";
import { toast } from "sonner";

export function CreateProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [domain, setDomain] = useState("");
  const createProject = useCreateProject();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const project = await createProject.mutateAsync({
        name,
        endpointUrl,
        domain: domain || undefined,
      });
      toast.success("Project created");
      setOpen(false);
      setName("");
      setEndpointUrl("");
      setDomain("");
      router.push(`/${project.id}/crons`);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Name</Label>
            <Input
              id="project-name"
              placeholder="My App"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endpoint-url">Endpoint URL</Label>
            <Input
              id="endpoint-url"
              placeholder="https://myapp.vercel.app/api/__pingback"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Domain (optional)</Label>
            <Input
              id="domain"
              placeholder="myapp.vercel.app"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full" disabled={createProject.isPending}>
            {createProject.isPending ? "Creating..." : "Create project"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Create projects page**

Create `apps/dashboard/app/(dashboard)/projects/page.tsx`:
```tsx
"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/lib/hooks/use-projects";
import { CreateProjectDialog } from "@/components/create-project-dialog";

export default function ProjectsPage() {
  const { data: projects, isLoading } = useProjects();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <CreateProjectDialog />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : projects?.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[var(--text-secondary)] mb-4">
            No projects yet. Create one to get started.
          </p>
          <CreateProjectDialog />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)]">
              <TableHead>Name</TableHead>
              <TableHead>Endpoint URL</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects?.map((project) => (
              <TableRow key={project.id} className="border-[var(--border)]">
                <TableCell>
                  <Link
                    href={`/${project.id}/crons`}
                    className="text-[var(--accent)] hover:underline font-medium"
                  >
                    {project.name}
                  </Link>
                </TableCell>
                <TableCell className="text-[var(--text-secondary)]">
                  {project.endpointUrl}
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {new Date(project.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/app/\(dashboard\)/projects/ apps/dashboard/components/create-project-dialog.tsx
git commit -m "feat(dashboard): add projects page with create dialog"
```

---

## Task 7: Placeholder Pages + Empty State

**Files:**
- Create: `apps/dashboard/components/empty-state.tsx`
- Create: 5 placeholder page files

- [ ] **Step 1: Create empty state component**

Create `apps/dashboard/components/empty-state.tsx`:
```tsx
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <Icon className="h-12 w-12 text-[var(--text-disabled)] mb-4" />
      <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-1">
        {title}
      </h3>
      <p className="text-sm text-[var(--text-muted)] max-w-sm text-center">
        {description}
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Create all placeholder pages**

Create `apps/dashboard/app/(dashboard)/[projectId]/crons/page.tsx`:
```tsx
import { Clock } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function CronsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Crons</h1>
      <EmptyState
        icon={Clock}
        title="No crons yet"
        description="Functions registered via the SDK will appear here."
      />
    </div>
  );
}
```

Create `apps/dashboard/app/(dashboard)/[projectId]/tasks/page.tsx`:
```tsx
import { ListChecks } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function TasksPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tasks</h1>
      <EmptyState
        icon={ListChecks}
        title="No tasks yet"
        description="Background tasks defined with task() will appear here."
      />
    </div>
  );
}
```

Create `apps/dashboard/app/(dashboard)/[projectId]/runs/page.tsx`:
```tsx
import { Play } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function RunsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Runs</h1>
      <EmptyState
        icon={Play}
        title="No runs yet"
        description="Execution history will appear here once your crons start running."
      />
    </div>
  );
}
```

Create `apps/dashboard/app/(dashboard)/[projectId]/logs/page.tsx`:
```tsx
import { Terminal } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function LogsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Logs</h1>
      <EmptyState
        icon={Terminal}
        title="No logs yet"
        description="Logs from ctx.log() calls will appear here."
      />
    </div>
  );
}
```

Create `apps/dashboard/app/(dashboard)/[projectId]/alerts/page.tsx`:
```tsx
import { Bell } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

export default function AlertsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Alerts</h1>
      <EmptyState
        icon={Bell}
        title="No alerts configured"
        description="Set up alert rules to get notified of failures."
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/dashboard/components/empty-state.tsx apps/dashboard/app/\(dashboard\)/\[projectId\]/
git commit -m "feat(dashboard): add placeholder pages with empty states"
```

---

## Task 8: API Keys Page

**Files:**
- Create: `apps/dashboard/lib/hooks/use-api-keys.ts`
- Create: `apps/dashboard/components/create-api-key-dialog.tsx`
- Create: `apps/dashboard/components/api-key-created-dialog.tsx`
- Create: `apps/dashboard/app/(dashboard)/[projectId]/api-keys/page.tsx`

- [ ] **Step 1: Create useApiKeys hook**

Create `apps/dashboard/lib/hooks/use-api-keys.ts`:
```typescript
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string;
  lastUsedAt?: string;
  createdAt: string;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  key: string;
  keyPrefix: string;
}

export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: ["api-keys", projectId],
    queryFn: () =>
      apiClient.get<ApiKey[]>(`/api/v1/projects/${projectId}/api-keys`),
    enabled: !!projectId,
  });
}

export function useCreateApiKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string }) =>
      apiClient.post<ApiKeyCreated>(
        `/api/v1/projects/${projectId}/api-keys`,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", projectId] });
    },
  });
}

export function useRevokeApiKey(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (keyId: string) =>
      apiClient.delete(`/api/v1/projects/${projectId}/api-keys/${keyId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", projectId] });
    },
  });
}
```

- [ ] **Step 2: Create API key created dialog (shows the full key once)**

Create `apps/dashboard/components/api-key-created-dialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Check, Copy } from "lucide-react";

interface ApiKeyCreatedDialogProps {
  apiKey: string | null;
  onClose: () => void;
}

export function ApiKeyCreatedDialog({
  apiKey,
  onClose,
}: ApiKeyCreatedDialogProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <Dialog open={!!apiKey} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>API key created</DialogTitle>
          <DialogDescription>
            Copy this key now. It will only be shown once.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 p-3 bg-[var(--surface)] rounded-md border border-[var(--border)] font-mono text-sm break-all">
          <span className="flex-1">{apiKey}</span>
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4 text-[var(--success)]" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create API key creation dialog**

Create `apps/dashboard/components/create-api-key-dialog.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { useCreateApiKey } from "@/lib/hooks/use-api-keys";
import { toast } from "sonner";

interface CreateApiKeyDialogProps {
  projectId: string;
  onCreated: (key: string) => void;
}

export function CreateApiKeyDialog({
  projectId,
  onCreated,
}: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const createApiKey = useCreateApiKey(projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await createApiKey.mutateAsync({ name });
      setOpen(false);
      setName("");
      onCreated(result.key);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create API key
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="key-name">Name</Label>
            <Input
              id="key-name"
              placeholder="e.g. Production, Development"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={createApiKey.isPending}>
            {createApiKey.isPending ? "Creating..." : "Create key"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Create API keys page**

Create `apps/dashboard/app/(dashboard)/[projectId]/api-keys/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Key, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { CreateApiKeyDialog } from "@/components/create-api-key-dialog";
import { ApiKeyCreatedDialog } from "@/components/api-key-created-dialog";
import { useApiKeys, useRevokeApiKey } from "@/lib/hooks/use-api-keys";
import { toast } from "sonner";

export default function ApiKeysPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const { data: apiKeys, isLoading } = useApiKeys(projectId);
  const revokeApiKey = useRevokeApiKey(projectId);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  async function handleRevoke(keyId: string, keyName: string) {
    if (!confirm(`Revoke "${keyName}"? This cannot be undone.`)) return;
    try {
      await revokeApiKey.mutateAsync(keyId);
      toast.success("API key revoked");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">API Keys</h1>
        <CreateApiKeyDialog
          projectId={projectId}
          onCreated={(key) => setCreatedKey(key)}
        />
      </div>

      <ApiKeyCreatedDialog
        apiKey={createdKey}
        onClose={() => setCreatedKey(null)}
      />

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : apiKeys?.length === 0 ? (
        <EmptyState
          icon={Key}
          title="No API keys"
          description="Create an API key to connect your app to Pingback."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-[var(--border)]">
              <TableHead>Name</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Last Used</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys?.map((key) => (
              <TableRow key={key.id} className="border-[var(--border)]">
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell className="font-mono text-sm text-[var(--text-muted)]">
                  {key.keyPrefix}...
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {key.lastUsedAt
                    ? new Date(key.lastUsedAt).toLocaleDateString()
                    : "Never"}
                </TableCell>
                <TableCell className="text-[var(--text-muted)]">
                  {new Date(key.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(key.id, key.name)}
                  >
                    <Trash2 className="h-4 w-4 text-[var(--error)]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/lib/hooks/use-api-keys.ts apps/dashboard/components/create-api-key-dialog.tsx apps/dashboard/components/api-key-created-dialog.tsx apps/dashboard/app/\(dashboard\)/\[projectId\]/api-keys/
git commit -m "feat(dashboard): add API keys page with create, list, and revoke"
```

---

## Task 9: Project Settings Page

**Files:**
- Create: `apps/dashboard/app/(dashboard)/[projectId]/settings/page.tsx`
- Modify: `apps/platform/src/modules/projects/projects.service.ts` (expose cronSecret for owner)

- [ ] **Step 1: Add PATCH endpoint to platform's projects controller**

The platform's `ProjectsController` currently only has POST, GET, DELETE. Add a PATCH endpoint for updating project details. In `apps/platform/src/modules/projects/projects.controller.ts`, add:

```typescript
@Patch(':projectId')
async update(
  @Req() req: Request,
  @Param('projectId') projectId: string,
  @Body() dto: Partial<CreateProjectDto>,
) {
  const user = req.user as { id: string };
  const project = await this.projectsService.findOneByUser(projectId, user.id);
  Object.assign(project, dto);
  return this.projectsService.save(project);
}
```

And add an `update` method to `ProjectsService`. Also verify `cronSecret` is included in project responses — it should be since `findOneByUser` returns the full entity.

- [ ] **Step 2: Create project settings page**

Create `apps/dashboard/app/(dashboard)/[projectId]/settings/page.tsx`:
```tsx
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, Copy } from "lucide-react";
import { useProject, useDeleteProject } from "@/lib/hooks/use-projects";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

export default function ProjectSettingsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { data: project, refetch } = useProject(projectId);
  const deleteProject = useDeleteProject();
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [domain, setDomain] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (project && !initialized) {
    setName(project.name);
    setEndpointUrl(project.endpointUrl);
    setDomain(project.domain || "");
    setInitialized(true);
  }

  function handleCopySecret() {
    if (project?.cronSecret) {
      navigator.clipboard.writeText(project.cronSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.patch(`/api/v1/projects/${projectId}`, {
        name,
        endpointUrl,
        domain: domain || undefined,
      });
      await refetch();
      toast.success("Project updated");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this project? This cannot be undone. All jobs and execution history will be lost.")) return;
    try {
      await deleteProject.mutateAsync(projectId);
      toast.success("Project deleted");
      router.push("/projects");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  if (!project) return null;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Project Settings</h1>

      <Card className="bg-[var(--surface)] border-[var(--border)] mb-6">
        <CardHeader>
          <CardTitle className="text-lg">General</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint URL</Label>
              <Input
                id="endpoint"
                value={endpointUrl}
                onChange={(e) => setEndpointUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain">Domain (optional)</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-[var(--surface)] border-[var(--border)] mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Cron Secret</CardTitle>
          <p className="text-sm text-[var(--text-secondary)]">
            Add this to your app as the <code className="text-xs bg-[var(--nav-active)] px-1 py-0.5 rounded">PINGBACK_CRON_SECRET</code> environment variable.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 bg-black rounded-md border border-[var(--border)] font-mono text-sm break-all">
            <span className="flex-1 text-[var(--text-secondary)]">
              {project.cronSecret}
            </span>
            <Button variant="ghost" size="sm" onClick={handleCopySecret}>
              {copied ? (
                <Check className="h-4 w-4 text-[var(--success)]" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card className="bg-[var(--surface)] border-[var(--error)]/20">
        <CardHeader>
          <CardTitle className="text-lg text-[var(--error)]">
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            Permanently delete this project, all its jobs, and execution history.
          </p>
          <Button variant="destructive" onClick={handleDelete}>
            Delete project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Add a "Settings" link to the sidebar PROJECT section**

In `apps/dashboard/components/sidebar.tsx`, add Settings to the `projectNav` array:

```typescript
import { Settings } from "lucide-react";

// Add to projectNav array after Alerts:
{ name: "Settings", href: "settings", icon: Settings },
```

- [ ] **Step 4: Verify the full flow**

Run both the platform and dashboard:
```bash
# Terminal 1
cd apps/platform && npm run start:dev

# Terminal 2
cd apps/dashboard && npm run dev
```

Test the flow:
1. Visit http://localhost:3000 → should redirect to /login
2. Register a new account
3. Create a project
4. See the sidebar with navigation
5. Visit API Keys → create a key, copy it
6. Visit Settings → see cron secret, edit project name
7. Click through placeholder pages

- [ ] **Step 5: Commit**

```bash
git add apps/dashboard/app/\(dashboard\)/\[projectId\]/settings/ apps/dashboard/components/sidebar.tsx
git commit -m "feat(dashboard): add project settings page with cron secret display"
```
