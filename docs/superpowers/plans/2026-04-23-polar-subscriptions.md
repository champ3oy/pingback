# Polar.sh Subscriptions & Feature Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 3-tier subscription billing (Free/Pro/Team) via Polar.sh with plan-based feature enforcement across the platform.

**Architecture:** A dedicated `SubscriptionModule` in the NestJS platform handles all Polar interaction — creating customers, checkout sessions, portal URLs, and processing webhooks. Plan state is cached on the User entity and kept in sync via webhooks. A `PlanLimitsService` provides enforcement checks consumed by Projects, Jobs, Worker, and Alerts services. The dashboard adds a billing section and upgrade prompts.

**Tech Stack:** `@polar-sh/sdk` for Polar API, NestJS module/service/controller pattern, TypeORM entity updates, React Query hooks in dashboard.

**Spec:** `docs/superpowers/specs/2026-04-23-polar-subscriptions-design.md`

---

## File Structure

### Platform (new files)
- `modules/subscription/subscription.module.ts` — Module registration
- `modules/subscription/subscription.service.ts` — Polar API wrapper (create customer, checkout, portal)
- `modules/subscription/subscription.controller.ts` — REST endpoints (checkout, portal, usage)
- `modules/subscription/webhook.controller.ts` — Polar webhook handler
- `modules/subscription/plan-limits.ts` — PLAN_LIMITS constant
- `modules/subscription/plan-limits.service.ts` — Enforcement checks (canCreateProject, canCreateJob, canExecute, etc.)
- `modules/subscription/plan-limits.service.spec.ts` — Tests for enforcement
- `modules/subscription/subscription.service.spec.ts` — Tests for Polar integration
- `modules/subscription/webhook.controller.spec.ts` — Tests for webhook handling

### Platform (modified files)
- `entities/user.entity.ts` — Add plan, polarCustomerId, polarSubscriptionId, executionsThisMonth, executionsResetAt
- `config/configuration.ts` — Add polar config block
- `app.module.ts` — Register SubscriptionModule, add User to entities if needed
- `modules/auth/auth.service.ts` — Call createFreeSubscription after user creation
- `modules/auth/auth.service.spec.ts` — Update tests for subscription creation
- `modules/projects/projects.service.ts` — Add project count check
- `modules/jobs/jobs.service.ts` — Add job count, interval, retry cap checks
- `modules/projects/registration.service.ts` — Add job count check on SDK registration
- `modules/worker/worker.service.ts` — Add execution count check, increment, lazy reset, fan-out cap
- `modules/alerts/alerts.service.ts` — Add alert channel check

### Dashboard (new files)
- `lib/hooks/use-subscription.ts` — Fetch usage/plan data, checkout/portal mutations
- `components/upgrade-banner.tsx` — Limit warning banner

### Dashboard (modified files)
- `app/(dashboard)/[projectId]/settings/page.tsx` — Add Plan & Billing section

### Website (modified files)
- `components/pricing.tsx` — Update CTA buttons for Pro/Team

### Config
- `.env.example` — Add Polar env vars

---

## Task 1: Install Polar SDK and add configuration

**Files:**
- Modify: `apps/platform/package.json`
- Modify: `apps/platform/src/config/configuration.ts:1-27`
- Modify: `.env.example`

- [ ] **Step 1: Install `@polar-sh/sdk`**

Run:
```bash
cd apps/platform && npm install @polar-sh/sdk
```

- [ ] **Step 2: Add Polar config block**

In `apps/platform/src/config/configuration.ts`, add the `polar` section:

```typescript
export default () => ({
  port: parseInt(process.env.PORT || '4000', 10),
  database: {
    url: process.env.DATABASE_URL,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  encryption: {
    key: process.env.ENCRYPTION_KEY,
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
  },
  dashboardUrl: process.env.DASHBOARD_URL || 'http://localhost:3000',
  pingback: {
    apiKey: process.env.PINGBACK_API_KEY,
    cronSecret: process.env.PINGBACK_CRON_SECRET,
    baseUrl: process.env.PINGBACK_BASE_URL,
    platformUrl: process.env.PINGBACK_PLATFORM_URL || 'https://api.pingback.lol',
  },
  polar: {
    accessToken: process.env.POLAR_ACCESS_TOKEN,
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET,
    products: {
      free: process.env.POLAR_FREE_PRODUCT_ID,
      pro: process.env.POLAR_PRO_PRODUCT_ID,
      team: process.env.POLAR_TEAM_PRODUCT_ID,
    },
  },
});
```

- [ ] **Step 3: Add env vars to `.env.example`**

Append to `.env.example`:

```
# Polar.sh (billing)
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_FREE_PRODUCT_ID=
POLAR_PRO_PRODUCT_ID=
POLAR_TEAM_PRODUCT_ID=
```

- [ ] **Step 4: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/platform/package.json apps/platform/package-lock.json apps/platform/src/config/configuration.ts .env.example
git commit -m "feat(subscription): install Polar SDK and add configuration"
```

---

## Task 2: Add subscription fields to User entity

**Files:**
- Modify: `apps/platform/src/entities/user.entity.ts:1-37`

- [ ] **Step 1: Add the five new columns to the User entity**

Update `apps/platform/src/entities/user.entity.ts` to:

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', unique: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'text', nullable: true, unique: true, name: 'github_id' })
  githubId: string;

  @Column({ type: 'text', nullable: true, name: 'avatar_url' })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true, name: 'refresh_token' })
  refreshToken: string;

  @Column({ type: 'text', default: 'free' })
  plan: 'free' | 'pro' | 'team';

  @Column({ type: 'text', nullable: true, name: 'polar_customer_id' })
  polarCustomerId: string;

  @Column({ type: 'text', nullable: true, name: 'polar_subscription_id' })
  polarSubscriptionId: string;

  @Column({ type: 'int', default: 0, name: 'executions_this_month' })
  executionsThisMonth: number;

  @Column({ type: 'timestamp', nullable: true, name: 'executions_reset_at' })
  executionsResetAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

- [ ] **Step 2: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds. TypeORM `synchronize: true` will auto-migrate the schema on next startup.

- [ ] **Step 3: Commit**

```bash
git add apps/platform/src/entities/user.entity.ts
git commit -m "feat(subscription): add plan and Polar fields to User entity"
```

---

## Task 3: Create plan limits config and PlanLimitsService

**Files:**
- Create: `apps/platform/src/modules/subscription/plan-limits.ts`
- Create: `apps/platform/src/modules/subscription/plan-limits.service.ts`
- Create: `apps/platform/src/modules/subscription/plan-limits.service.spec.ts`

- [ ] **Step 1: Write the test file for PlanLimitsService**

Create `apps/platform/src/modules/subscription/plan-limits.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PlanLimitsService } from './plan-limits.service';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';
import { Job } from '../jobs/job.entity';

describe('PlanLimitsService', () => {
  let service: PlanLimitsService;
  let projectRepo: Record<string, jest.Mock>;
  let jobRepo: Record<string, jest.Mock>;

  const freeUser = {
    id: 'user-1',
    plan: 'free' as const,
    executionsThisMonth: 0,
    executionsResetAt: new Date('2026-05-01'),
  } as User;

  const proUser = {
    id: 'user-2',
    plan: 'pro' as const,
    executionsThisMonth: 0,
    executionsResetAt: new Date('2026-05-01'),
  } as User;

  beforeEach(async () => {
    projectRepo = { count: jest.fn() };
    jobRepo = { count: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        PlanLimitsService,
        { provide: getRepositoryToken(Project), useValue: projectRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
      ],
    }).compile();

    service = module.get(PlanLimitsService);
  });

  describe('canCreateProject', () => {
    it('should allow free user with 0 projects', async () => {
      projectRepo.count.mockResolvedValue(0);
      const result = await service.canCreateProject(freeUser);
      expect(result.allowed).toBe(true);
    });

    it('should block free user at limit', async () => {
      projectRepo.count.mockResolvedValue(1);
      const result = await service.canCreateProject(freeUser);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Project limit reached');
    });

    it('should allow pro user with 4 projects', async () => {
      projectRepo.count.mockResolvedValue(4);
      const result = await service.canCreateProject(proUser);
      expect(result.allowed).toBe(true);
    });
  });

  describe('canCreateJob', () => {
    it('should allow free user with 4 jobs', async () => {
      jobRepo.count.mockResolvedValue(4);
      const result = await service.canCreateJob(freeUser, 'project-1');
      expect(result.allowed).toBe(true);
    });

    it('should block free user at 5 jobs', async () => {
      jobRepo.count.mockResolvedValue(5);
      const result = await service.canCreateJob(freeUser, 'project-1');
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Job limit reached');
    });
  });

  describe('canExecute', () => {
    it('should allow when under limit', async () => {
      const result = service.canExecute(freeUser);
      expect(result.allowed).toBe(true);
    });

    it('should block free user at 1000 executions', () => {
      const user = { ...freeUser, executionsThisMonth: 1000 };
      const result = service.canExecute(user as User);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Monthly execution limit reached');
    });
  });

  describe('checkInterval', () => {
    it('should block free user with interval under 60s', () => {
      const result = service.checkInterval(freeUser, 30);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Minimum interval');
    });

    it('should allow pro user with 10s interval', () => {
      const result = service.checkInterval(proUser, 10);
      expect(result.allowed).toBe(true);
    });
  });

  describe('capRetries', () => {
    it('should cap free user retries at 1', () => {
      expect(service.capRetries(freeUser, 5)).toBe(1);
    });

    it('should allow pro user up to 5 retries', () => {
      expect(service.capRetries(proUser, 5)).toBe(5);
    });
  });

  describe('capFanOut', () => {
    it('should return empty array for free user', () => {
      const tasks = [{ name: 'a', payload: {} }];
      expect(service.capFanOut(freeUser, tasks)).toEqual([]);
    });

    it('should cap pro user at 10 tasks', () => {
      const tasks = Array.from({ length: 15 }, (_, i) => ({ name: `t${i}`, payload: {} }));
      expect(service.capFanOut(proUser, tasks)).toHaveLength(10);
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:
```bash
cd apps/platform && npx jest --testPathPattern plan-limits.service.spec --no-coverage
```
Expected: FAIL — cannot find `./plan-limits.service`.

- [ ] **Step 3: Create the plan limits config**

Create `apps/platform/src/modules/subscription/plan-limits.ts`:

```typescript
export type PlanType = 'free' | 'pro' | 'team';

export interface PlanLimit {
  projects: number;
  jobs: number;
  executionsPerMonth: number;
  minIntervalSeconds: number;
  logRetentionDays: number;
  retries: number;
  fanOutPerRun: number;
  alertChannels: string[];
  teamMembers: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimit> = {
  free: {
    projects: 1,
    jobs: 5,
    executionsPerMonth: 1_000,
    minIntervalSeconds: 60,
    logRetentionDays: 1,
    retries: 1,
    fanOutPerRun: 0,
    alertChannels: ['email'],
    teamMembers: 1,
  },
  pro: {
    projects: 5,
    jobs: 50,
    executionsPerMonth: 50_000,
    minIntervalSeconds: 10,
    logRetentionDays: 30,
    retries: 5,
    fanOutPerRun: 10,
    alertChannels: ['email', 'webhook'],
    teamMembers: 1,
  },
  team: {
    projects: Infinity,
    jobs: Infinity,
    executionsPerMonth: 500_000,
    minIntervalSeconds: 10,
    logRetentionDays: 90,
    retries: 10,
    fanOutPerRun: 100,
    alertChannels: ['email', 'webhook'],
    teamMembers: 10,
  },
};
```

- [ ] **Step 4: Create the PlanLimitsService**

Create `apps/platform/src/modules/subscription/plan-limits.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';
import { Job } from '../jobs/job.entity';
import { PLAN_LIMITS, PlanType } from './plan-limits';

interface LimitCheck {
  allowed: boolean;
  message?: string;
}

@Injectable()
export class PlanLimitsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
    @InjectRepository(Job) private jobRepo: Repository<Job>,
  ) {}

  private limits(user: User) {
    return PLAN_LIMITS[user.plan as PlanType] || PLAN_LIMITS.free;
  }

  async canCreateProject(user: User): Promise<LimitCheck> {
    const limits = this.limits(user);
    if (limits.projects === Infinity) return { allowed: true };
    const count = await this.projectRepo.count({ where: { userId: user.id } });
    if (count >= limits.projects) {
      return {
        allowed: false,
        message: `Project limit reached (${count}/${limits.projects}). Upgrade your plan.`,
      };
    }
    return { allowed: true };
  }

  async canCreateJob(user: User, projectId: string): Promise<LimitCheck> {
    const limits = this.limits(user);
    if (limits.jobs === Infinity) return { allowed: true };
    const count = await this.jobRepo.count({
      where: { projectId, status: 'active' as any },
    });
    if (count >= limits.jobs) {
      return {
        allowed: false,
        message: `Job limit reached (${count}/${limits.jobs}). Upgrade your plan.`,
      };
    }
    return { allowed: true };
  }

  canExecute(user: User): LimitCheck {
    const limits = this.limits(user);
    if (user.executionsThisMonth >= limits.executionsPerMonth) {
      return {
        allowed: false,
        message: 'Monthly execution limit reached. Upgrade your plan.',
      };
    }
    return { allowed: true };
  }

  checkInterval(user: User, intervalSeconds: number): LimitCheck {
    const limits = this.limits(user);
    if (intervalSeconds < limits.minIntervalSeconds) {
      return {
        allowed: false,
        message: `Minimum interval is ${limits.minIntervalSeconds}s on ${user.plan} plan.`,
      };
    }
    return { allowed: true };
  }

  capRetries(user: User, retries: number): number {
    const limits = this.limits(user);
    return Math.min(retries, limits.retries);
  }

  capFanOut(user: User, tasks: any[]): any[] {
    const limits = this.limits(user);
    return tasks.slice(0, limits.fanOutPerRun);
  }

  checkAlertChannel(user: User, channel: string): LimitCheck {
    const limits = this.limits(user);
    if (!limits.alertChannels.includes(channel)) {
      return {
        allowed: false,
        message: `${channel} alerts require Pro or Team plan.`,
      };
    }
    return { allowed: true };
  }

  async getUsage(user: User) {
    const limits = this.limits(user);
    const projectCount = await this.projectRepo.count({ where: { userId: user.id } });

    // Count active jobs across all user's projects
    const jobCount = await this.jobRepo
      .createQueryBuilder('job')
      .innerJoin('job.project', 'project')
      .where('project.user_id = :userId', { userId: user.id })
      .andWhere('job.status = :status', { status: 'active' })
      .getCount();

    return {
      plan: user.plan,
      projects: { used: projectCount, limit: limits.projects },
      jobs: { used: jobCount, limit: limits.jobs },
      executions: {
        used: user.executionsThisMonth,
        limit: limits.executionsPerMonth,
        resetsAt: user.executionsResetAt,
      },
    };
  }
}
```

- [ ] **Step 5: Run the tests**

Run:
```bash
cd apps/platform && npx jest --testPathPattern plan-limits.service.spec --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/modules/subscription/plan-limits.ts apps/platform/src/modules/subscription/plan-limits.service.ts apps/platform/src/modules/subscription/plan-limits.service.spec.ts
git commit -m "feat(subscription): add plan limits config and PlanLimitsService with tests"
```

---

## Task 4: Create SubscriptionService (Polar API wrapper)

**Files:**
- Create: `apps/platform/src/modules/subscription/subscription.service.ts`
- Create: `apps/platform/src/modules/subscription/subscription.service.spec.ts`

- [ ] **Step 1: Write the test file**

Create `apps/platform/src/modules/subscription/subscription.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SubscriptionService } from './subscription.service';
import { User } from '../../entities/user.entity';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let userRepo: Record<string, jest.Mock>;
  let configService: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepo = {
      save: jest.fn().mockImplementation((u) => Promise.resolve(u)),
      findOne: jest.fn(),
    };
    configService = {
      get: jest.fn((key: string) => {
        const config: Record<string, any> = {
          'polar.accessToken': 'test-token',
          'polar.webhookSecret': 'test-secret',
          'polar.products.free': 'prod-free',
          'polar.products.pro': 'prod-pro',
          'polar.products.team': 'prod-team',
          dashboardUrl: 'http://localhost:3000',
        };
        return config[key];
      }),
    };

    const module = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get(SubscriptionService);
  });

  describe('getProductForPlan', () => {
    it('should return correct product ID for each plan', () => {
      expect(service.getProductForPlan('free')).toBe('prod-free');
      expect(service.getProductForPlan('pro')).toBe('prod-pro');
      expect(service.getProductForPlan('team')).toBe('prod-team');
    });
  });

  describe('getPlanForProduct', () => {
    it('should return correct plan for each product ID', () => {
      expect(service.getPlanForProduct('prod-free')).toBe('free');
      expect(service.getPlanForProduct('prod-pro')).toBe('pro');
      expect(service.getPlanForProduct('prod-team')).toBe('team');
    });

    it('should return null for unknown product ID', () => {
      expect(service.getPlanForProduct('unknown')).toBeNull();
    });
  });

  describe('updateUserPlan', () => {
    it('should update user plan and subscription ID', async () => {
      const user = { id: 'user-1', plan: 'free' } as User;
      userRepo.findOne.mockResolvedValue(user);

      await service.updateUserPlan('user-1', 'pro', 'sub-123');

      expect(userRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          plan: 'pro',
          polarSubscriptionId: 'sub-123',
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/platform && npx jest --testPathPattern subscription.service.spec --no-coverage
```
Expected: FAIL — cannot find `./subscription.service`.

- [ ] **Step 3: Create the SubscriptionService**

Create `apps/platform/src/modules/subscription/subscription.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Polar } from '@polar-sh/sdk';
import { User } from '../../entities/user.entity';
import { PlanType } from './plan-limits';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);
  private readonly polar: Polar;
  private readonly productToPlan: Record<string, PlanType>;

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private config: ConfigService,
  ) {
    this.polar = new Polar({
      accessToken: this.config.get<string>('polar.accessToken'),
    });

    const freeId = this.config.get<string>('polar.products.free');
    const proId = this.config.get<string>('polar.products.pro');
    const teamId = this.config.get<string>('polar.products.team');

    this.productToPlan = {};
    if (freeId) this.productToPlan[freeId] = 'free';
    if (proId) this.productToPlan[proId] = 'pro';
    if (teamId) this.productToPlan[teamId] = 'team';
  }

  getProductForPlan(plan: PlanType): string | undefined {
    return this.config.get<string>(`polar.products.${plan}`);
  }

  getPlanForProduct(productId: string): PlanType | null {
    return this.productToPlan[productId] || null;
  }

  async createFreeSubscription(user: User): Promise<void> {
    try {
      const customer = await this.polar.customers.create({
        email: user.email,
        externalId: user.id,
        name: user.name || undefined,
      });

      const freeProductId = this.getProductForPlan('free');
      if (!freeProductId) {
        this.logger.warn('POLAR_FREE_PRODUCT_ID not configured, skipping free subscription');
        user.polarCustomerId = customer.id;
        await this.userRepo.save(user);
        return;
      }

      const subscription = await this.polar.subscriptions.create({
        customerId: customer.id,
        productId: freeProductId,
      });

      user.polarCustomerId = customer.id;
      user.polarSubscriptionId = subscription.id;
      user.executionsResetAt = this.nextMonthReset();
      await this.userRepo.save(user);
    } catch (err) {
      this.logger.error(`Failed to create Polar subscription for user ${user.id}: ${(err as Error).message}`);
    }
  }

  async createCheckoutSession(
    user: User,
    plan: 'pro' | 'team',
  ): Promise<{ url: string }> {
    const productId = this.getProductForPlan(plan);
    if (!productId) {
      throw new Error(`No Polar product configured for plan: ${plan}`);
    }

    const checkout = await this.polar.checkouts.create({
      productId,
      customerExternalId: user.id,
      successUrl: `${this.config.get<string>('dashboardUrl')}/settings?upgraded=true`,
    });

    return { url: checkout.url };
  }

  async getPortalUrl(user: User): Promise<{ url: string }> {
    if (!user.polarCustomerId) {
      throw new Error('User has no Polar customer ID');
    }

    const session = await this.polar.customerSessions.create({
      customerId: user.polarCustomerId,
    });

    return { url: session.customerPortalUrl };
  }

  async updateUserPlan(
    userId: string,
    plan: PlanType,
    subscriptionId?: string,
  ): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      this.logger.warn(`Webhook: user not found for ID ${userId}`);
      return;
    }

    user.plan = plan;
    if (subscriptionId) user.polarSubscriptionId = subscriptionId;

    // Reset execution counter when upgrading
    if (plan !== 'free' && user.executionsResetAt === null) {
      user.executionsResetAt = this.nextMonthReset();
    }

    await this.userRepo.save(user);
    this.logger.log(`Updated user ${userId} to plan: ${plan}`);
  }

  private nextMonthReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
}
```

- [ ] **Step 4: Run the tests**

Run:
```bash
cd apps/platform && npx jest --testPathPattern subscription.service.spec --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/modules/subscription/subscription.service.ts apps/platform/src/modules/subscription/subscription.service.spec.ts
git commit -m "feat(subscription): add SubscriptionService with Polar API integration"
```

---

## Task 5: Create webhook controller

**Files:**
- Create: `apps/platform/src/modules/subscription/webhook.controller.ts`
- Create: `apps/platform/src/modules/subscription/webhook.controller.spec.ts`

- [ ] **Step 1: Write the test file**

Create `apps/platform/src/modules/subscription/webhook.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { SubscriptionService } from './subscription.service';
import { ConfigService } from '@nestjs/config';

describe('WebhookController', () => {
  let controller: WebhookController;
  let subscriptionService: Record<string, jest.Mock>;

  beforeEach(async () => {
    subscriptionService = {
      getPlanForProduct: jest.fn(),
      updateUserPlan: jest.fn().mockResolvedValue(undefined),
      createFreeSubscription: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: SubscriptionService, useValue: subscriptionService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-webhook-secret'),
          },
        },
      ],
    }).compile();

    controller = module.get(WebhookController);
  });

  describe('handleWebhook', () => {
    it('should update plan on subscription.active', async () => {
      subscriptionService.getPlanForProduct.mockReturnValue('pro');

      const payload = {
        type: 'subscription.active',
        data: {
          id: 'sub-1',
          productId: 'prod-pro',
          customer: { externalId: 'user-1' },
        },
      };

      await controller.handleWebhook(payload);

      expect(subscriptionService.updateUserPlan).toHaveBeenCalledWith(
        'user-1',
        'pro',
        'sub-1',
      );
    });

    it('should revert to free on subscription.revoked', async () => {
      const payload = {
        type: 'subscription.revoked',
        data: {
          id: 'sub-1',
          productId: 'prod-pro',
          customer: { externalId: 'user-1' },
        },
      };

      await controller.handleWebhook(payload);

      expect(subscriptionService.updateUserPlan).toHaveBeenCalledWith(
        'user-1',
        'free',
        undefined,
      );
    });

    it('should ignore events without externalId', async () => {
      const payload = {
        type: 'subscription.active',
        data: {
          id: 'sub-1',
          productId: 'prod-pro',
          customer: { externalId: null },
        },
      };

      await controller.handleWebhook(payload);

      expect(subscriptionService.updateUserPlan).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:
```bash
cd apps/platform && npx jest --testPathPattern webhook.controller.spec --no-coverage
```
Expected: FAIL — cannot find `./webhook.controller`.

- [ ] **Step 3: Create the webhook controller**

Create `apps/platform/src/modules/subscription/webhook.controller.ts`:

```typescript
import { Controller, Post, Body, Logger, RawBodyRequest, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiExcludeEndpoint } from '@nestjs/swagger';
import { SubscriptionService } from './subscription.service';

@ApiTags('Webhooks')
@Controller('api/v1/webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private subscriptionService: SubscriptionService) {}

  @Post('polar')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async handleWebhook(@Body() payload: any) {
    const type = payload.type;
    const data = payload.data;

    this.logger.log(`Received Polar webhook: ${type}`);

    const externalId = data?.customer?.externalId;
    if (!externalId) {
      this.logger.warn(`Webhook ${type}: no externalId on customer, skipping`);
      return { received: true };
    }

    switch (type) {
      case 'subscription.active':
      case 'subscription.updated': {
        const plan = this.subscriptionService.getPlanForProduct(data.productId);
        if (plan) {
          await this.subscriptionService.updateUserPlan(externalId, plan, data.id);
        } else {
          this.logger.warn(`Unknown product ID: ${data.productId}`);
        }
        break;
      }

      case 'subscription.canceled':
        // Keep current plan until period ends — Polar handles end-of-period revocation
        this.logger.log(`Subscription canceled for user ${externalId}, keeping plan until period ends`);
        break;

      case 'subscription.revoked':
        await this.subscriptionService.updateUserPlan(externalId, 'free', undefined);
        break;

      default:
        this.logger.debug(`Unhandled webhook type: ${type}`);
    }

    return { received: true };
  }
}
```

- [ ] **Step 4: Run the tests**

Run:
```bash
cd apps/platform && npx jest --testPathPattern webhook.controller.spec --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/modules/subscription/webhook.controller.ts apps/platform/src/modules/subscription/webhook.controller.spec.ts
git commit -m "feat(subscription): add Polar webhook controller with tests"
```

---

## Task 6: Create SubscriptionController and SubscriptionModule

**Files:**
- Create: `apps/platform/src/modules/subscription/subscription.controller.ts`
- Create: `apps/platform/src/modules/subscription/subscription.module.ts`
- Modify: `apps/platform/src/app.module.ts:1-54`

- [ ] **Step 1: Create the SubscriptionController**

Create `apps/platform/src/modules/subscription/subscription.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubscriptionService } from './subscription.service';
import { PlanLimitsService } from './plan-limits.service';
import { User } from '../../entities/user.entity';

@ApiTags('Subscription')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/subscription')
export class SubscriptionController {
  constructor(
    private subscriptionService: SubscriptionService,
    private planLimitsService: PlanLimitsService,
    @InjectRepository(User) private userRepo: Repository<User>,
  ) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Create a Polar checkout session for upgrade' })
  @ApiResponse({ status: 200, description: 'Returns checkout URL' })
  async createCheckout(
    @Req() req: Request,
    @Body() body: { plan: 'pro' | 'team' },
  ) {
    if (!body.plan || !['pro', 'team'].includes(body.plan)) {
      throw new BadRequestException('Plan must be "pro" or "team"');
    }

    const userId = (req.user as { id: string }).id;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException();

    return this.subscriptionService.createCheckoutSession(user, body.plan);
  }

  @Get('portal')
  @ApiOperation({ summary: 'Get Polar customer portal URL' })
  @ApiResponse({ status: 200, description: 'Returns portal URL' })
  async getPortal(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException();

    return this.subscriptionService.getPortalUrl(user);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get current usage and plan limits' })
  @ApiResponse({ status: 200, description: 'Returns usage data' })
  async getUsage(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new ForbiddenException();

    return this.planLimitsService.getUsage(user);
  }
}
```

- [ ] **Step 2: Create the SubscriptionModule**

Create `apps/platform/src/modules/subscription/subscription.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';
import { Job } from '../jobs/job.entity';
import { SubscriptionService } from './subscription.service';
import { SubscriptionController } from './subscription.controller';
import { WebhookController } from './webhook.controller';
import { PlanLimitsService } from './plan-limits.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Project, Job])],
  controllers: [SubscriptionController, WebhookController],
  providers: [SubscriptionService, PlanLimitsService],
  exports: [SubscriptionService, PlanLimitsService],
})
export class SubscriptionModule {}
```

- [ ] **Step 3: Register SubscriptionModule in AppModule**

In `apps/platform/src/app.module.ts`, add the import for `SubscriptionModule`:

Add to the imports at the top:
```typescript
import { SubscriptionModule } from './modules/subscription/subscription.module';
```

Add `SubscriptionModule` to the `imports` array after `OnboardingModule`.

- [ ] **Step 4: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds.

- [ ] **Step 5: Run all subscription tests**

Run:
```bash
cd apps/platform && npx jest --testPathPattern subscription --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/modules/subscription/subscription.controller.ts apps/platform/src/modules/subscription/subscription.module.ts apps/platform/src/app.module.ts
git commit -m "feat(subscription): add SubscriptionController, module, and register in AppModule"
```

---

## Task 7: Integrate subscription creation into auth flow

**Files:**
- Modify: `apps/platform/src/modules/auth/auth.service.ts:1-181`
- Modify: `apps/platform/src/modules/auth/auth.module.ts:1-50`
- Modify: `apps/platform/src/modules/auth/auth.service.spec.ts`

- [ ] **Step 1: Update AuthModule to import SubscriptionModule**

In `apps/platform/src/modules/auth/auth.module.ts`, add the import:

```typescript
import { SubscriptionModule } from '../subscription/subscription.module';
```

Add `SubscriptionModule` to the `imports` array:

```typescript
imports: [
  TypeOrmModule.forFeature([User, ApiKey]),
  PassportModule,
  SubscriptionModule,
  JwtModule.registerAsync({
    // ... existing config
  }),
],
```

- [ ] **Step 2: Update AuthService to inject SubscriptionService and call it on signup**

In `apps/platform/src/modules/auth/auth.service.ts`:

Add import at top:
```typescript
import { SubscriptionService } from '../subscription/subscription.service';
```

Add to constructor:
```typescript
constructor(
  @InjectRepository(User) private userRepo: Repository<User>,
  private jwtService: JwtService,
  private pingback: PingbackClient,
  private subscriptionService: SubscriptionService,
) {}
```

In the `register` method, after `await this.userRepo.save(user);` and before the pingback trigger, add:
```typescript
this.subscriptionService.createFreeSubscription(user).catch((err) => {
  // Don't block registration if Polar is down
});
```

In the `findOrCreateGithubUser` method, after `const saved = await this.userRepo.save(user);` and before the pingback trigger, add:
```typescript
this.subscriptionService.createFreeSubscription(saved).catch((err) => {
  // Don't block registration if Polar is down
});
```

- [ ] **Step 3: Update auth tests**

In `apps/platform/src/modules/auth/auth.service.spec.ts`, add the mock for SubscriptionService.

Add to the `beforeEach`:
```typescript
const subscriptionService = {
  createFreeSubscription: jest.fn().mockResolvedValue(undefined),
};
```

Add to the providers array in `Test.createTestingModule`:
```typescript
{ provide: SubscriptionService, useValue: subscriptionService },
```

Add the import at the top:
```typescript
import { SubscriptionService } from '../subscription/subscription.service';
```

- [ ] **Step 4: Run auth tests**

Run:
```bash
cd apps/platform && npx jest --testPathPattern auth.service.spec --no-coverage
```
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/platform/src/modules/auth/auth.service.ts apps/platform/src/modules/auth/auth.module.ts apps/platform/src/modules/auth/auth.service.spec.ts
git commit -m "feat(subscription): create free Polar subscription on user signup"
```

---

## Task 8: Add enforcement to ProjectsService

**Files:**
- Modify: `apps/platform/src/modules/projects/projects.service.ts:1-50`
- Modify: `apps/platform/src/modules/projects/projects.module.ts`

- [ ] **Step 1: Update ProjectsModule to import SubscriptionModule**

In `apps/platform/src/modules/projects/projects.module.ts`, add:

```typescript
import { SubscriptionModule } from '../subscription/subscription.module';
```

Add `SubscriptionModule` to the `imports` array.

- [ ] **Step 2: Update ProjectsService to inject PlanLimitsService and User repo**

In `apps/platform/src/modules/projects/projects.service.ts`:

Add imports:
```typescript
import { ForbiddenException } from '@nestjs/common';
import { PlanLimitsService } from '../subscription/plan-limits.service';
import { User } from '../../entities/user.entity';
```

Update the constructor:
```typescript
constructor(
  @InjectRepository(Project) private projectRepo: Repository<Project>,
  @InjectRepository(User) private userRepo: Repository<User>,
  private planLimitsService: PlanLimitsService,
) {}
```

Add `TypeOrmModule.forFeature([User])` to the module imports if not already present (handled by SubscriptionModule export).

Update the `create` method to check limits:

```typescript
async create(userId: string, dto: CreateProjectDto) {
  const user = await this.userRepo.findOne({ where: { id: userId } });
  if (!user) throw new NotFoundException('User not found');

  const check = await this.planLimitsService.canCreateProject(user);
  if (!check.allowed) {
    throw new ForbiddenException(check.message);
  }

  const cronSecret = randomBytes(32).toString('hex');
  const project = this.projectRepo.create({
    userId,
    name: dto.name,
    endpointUrl: dto.endpointUrl,
    domain: dto.domain,
    cronSecret,
  });
  return this.projectRepo.save(project);
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/modules/projects/projects.service.ts apps/platform/src/modules/projects/projects.module.ts
git commit -m "feat(subscription): enforce project limit on creation"
```

---

## Task 9: Add enforcement to JobsService and RegistrationService

**Files:**
- Modify: `apps/platform/src/modules/jobs/jobs.service.ts:1-98`
- Modify: `apps/platform/src/modules/jobs/jobs.module.ts`
- Modify: `apps/platform/src/modules/projects/registration.service.ts:1-85`

- [ ] **Step 1: Update JobsModule to import SubscriptionModule**

In `apps/platform/src/modules/jobs/jobs.module.ts`, add:

```typescript
import { SubscriptionModule } from '../subscription/subscription.module';
```

Add `SubscriptionModule` to the `imports` array. Also add `TypeOrmModule.forFeature([User])` if not already present through SubscriptionModule.

- [ ] **Step 2: Update JobsService to check job limits and cap retries**

In `apps/platform/src/modules/jobs/jobs.service.ts`:

Add imports:
```typescript
import { ForbiddenException } from '@nestjs/common';
import { PlanLimitsService } from '../subscription/plan-limits.service';
import { User } from '../../entities/user.entity';
```

Update constructor to inject `PlanLimitsService` and `@InjectRepository(User)`:

```typescript
constructor(
  @InjectRepository(Job) private jobRepo: Repository<Job>,
  @InjectRepository(User) private userRepo: Repository<User>,
  private planLimitsService: PlanLimitsService,
) {}
```

Update the `create` method to add plan checks. The method needs a `userId` parameter. Since the controller already has the userId, pass it through:

```typescript
async create(projectId: string, dto: CreateJobDto, userId?: string) {
  if (userId) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (user) {
      const jobCheck = await this.planLimitsService.canCreateJob(user, projectId);
      if (!jobCheck.allowed) {
        throw new ForbiddenException(jobCheck.message);
      }

      // Cap retries to plan limit
      if (dto.retries !== undefined) {
        dto.retries = this.planLimitsService.capRetries(user, dto.retries);
      }
    }
  }

  const nextRunAt = this.computeNextRunAt(dto.schedule);

  // Note: minIntervalSeconds enforcement for cron schedules can be added here
  // by parsing the cron expression and checking the interval against the plan limit.
  // For MVP, the cron-parser library validates the expression, and interval checks
  // can be added when needed.
  const job = this.jobRepo.create({
    projectId,
    name: dto.name,
    schedule: dto.schedule,
    retries: dto.retries ?? 0,
    timeoutSeconds: dto.timeoutSeconds ?? 30,
    concurrency: dto.concurrency ?? 1,
    source: 'manual' as const,
    nextRunAt,
  });
  return this.jobRepo.save(job);
}
```

Update the controller that calls `create` to pass `userId`. In `apps/platform/src/modules/jobs/jobs.controller.ts`, find the dashboard create handler and pass the user ID:

```typescript
// In the dashboard controller's create method, change:
return this.jobsService.create(projectId, dto, user.id);
```

- [ ] **Step 3: Update RegistrationService to check job limits and cap retries**

In `apps/platform/src/modules/projects/registration.service.ts`:

Add imports:
```typescript
import { ForbiddenException } from '@nestjs/common';
import { PlanLimitsService } from '../subscription/plan-limits.service';
import { User } from '../../entities/user.entity';
```

Update constructor:
```typescript
constructor(
  @InjectRepository(Job) private jobRepo: Repository<Job>,
  @InjectRepository(Project) private projectRepo: Repository<Project>,
  @InjectRepository(User) private userRepo: Repository<User>,
  private planLimitsService: PlanLimitsService,
) {}
```

In the `register` method, before the function loop, load the user from the project and check the job limit:

```typescript
async register(projectId: string, functions: FunctionMetadata[], endpointUrl?: string) {
  const results: Array<{ name: string; status: string }> = [];

  const project = await this.projectRepo.findOne({ where: { id: projectId } });
  const user = project
    ? await this.userRepo.findOne({ where: { id: project.userId } })
    : null;

  if (endpointUrl) {
    await this.projectRepo.update(projectId, { endpointUrl });
  }

  for (const fn of functions) {
    const existing = await this.jobRepo.findOne({
      where: { projectId, name: fn.name },
    });

    // Only check limit for new jobs (not updates)
    if (!existing && user) {
      const jobCheck = await this.planLimitsService.canCreateJob(user, projectId);
      if (!jobCheck.allowed) {
        throw new ForbiddenException(jobCheck.message);
      }
    }

    const timeoutStr = fn.options?.timeout;
    const timeoutSeconds = timeoutStr
      ? parseInt(timeoutStr.replace('s', ''))
      : 30;

    // Cap retries to plan limit
    let retries = fn.options?.retries ?? (existing?.retries ?? 0);
    if (user) {
      retries = this.planLimitsService.capRetries(user, retries);
    }

    // ... rest of the loop stays the same but uses capped `retries`
```

Update the `jobData` to use the capped `retries` variable instead of `fn.options?.retries`.

- [ ] **Step 4: Update the projects module to include User entity**

In `apps/platform/src/modules/projects/projects.module.ts`, add `User` to `TypeOrmModule.forFeature([...])` and import `SubscriptionModule` if not already done.

- [ ] **Step 5: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/modules/jobs/ apps/platform/src/modules/projects/
git commit -m "feat(subscription): enforce job limits and cap retries in Jobs and Registration services"
```

---

## Task 10: Add enforcement to WorkerService

**Files:**
- Modify: `apps/platform/src/modules/worker/worker.service.ts:1-216`
- Modify: `apps/platform/src/modules/worker/worker.module.ts`

- [ ] **Step 1: Update WorkerModule to import SubscriptionModule**

In `apps/platform/src/modules/worker/worker.module.ts`, add:

```typescript
import { SubscriptionModule } from '../subscription/subscription.module';
```

Add `SubscriptionModule` to the `imports` array. Also add `TypeOrmModule.forFeature([User, Project])` if not already present.

- [ ] **Step 2: Update WorkerService to check execution limits and cap fan-out**

In `apps/platform/src/modules/worker/worker.service.ts`:

Add imports:
```typescript
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlanLimitsService } from '../subscription/plan-limits.service';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';
```

Update constructor:
```typescript
constructor(
  private executionsService: ExecutionsService,
  private queueService: QueueService,
  private alertsService: AlertsService,
  private jobsService: JobsService,
  private planLimitsService: PlanLimitsService,
  @InjectRepository(User) private userRepo: Repository<User>,
  @InjectRepository(Project) private projectRepo: Repository<Project>,
) {}
```

In the `processJob` method, after `await this.executionsService.markRunning(msg.executionId);`, add the execution limit check:

```typescript
// Load project owner for plan checks
const project = await this.projectRepo.findOne({ where: { id: msg.projectId } });
let user: User | null = null;
if (project) {
  user = await this.userRepo.findOne({ where: { id: project.userId } });
}

if (user) {
  // Lazy reset of monthly counter
  if (user.executionsResetAt && new Date() > user.executionsResetAt) {
    user.executionsThisMonth = 0;
    user.executionsResetAt = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      1,
    );
    await this.userRepo.save(user);
  }

  // Check execution limit
  const execCheck = this.planLimitsService.canExecute(user);
  if (!execCheck.allowed) {
    await this.executionsService.markCompleted(msg.executionId, {
      status: 'failed',
      errorMessage: execCheck.message || 'Monthly execution limit reached',
    });
    return;
  }

  // Increment execution counter
  user.executionsThisMonth += 1;
  await this.userRepo.save(user);
}
```

In the fan-out section (where `tasks` are processed), add the cap before the loop:

```typescript
// Fan-out: dispatch child tasks
let tasksToDispatch = tasks;
if (user) {
  tasksToDispatch = this.planLimitsService.capFanOut(user, tasks);
  if (tasksToDispatch.length < tasks.length) {
    this.logger.warn(
      `Fan-out capped: ${tasks.length} tasks requested, ${tasksToDispatch.length} allowed for ${user.plan} plan`,
    );
  }
}
for (const task of tasksToDispatch) {
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/modules/worker/worker.service.ts apps/platform/src/modules/worker/worker.module.ts
git commit -m "feat(subscription): enforce execution limits and fan-out cap in worker"
```

---

## Task 11: Add enforcement to AlertsService

**Files:**
- Modify: `apps/platform/src/modules/alerts/alerts.service.ts:143-154`
- Modify: `apps/platform/src/modules/alerts/alerts.module.ts`

- [ ] **Step 1: Update AlertsModule to import SubscriptionModule**

In `apps/platform/src/modules/alerts/alerts.module.ts`, add:

```typescript
import { SubscriptionModule } from '../subscription/subscription.module';
```

Add `SubscriptionModule` to the `imports` array. Also add `TypeOrmModule.forFeature([User])`.

- [ ] **Step 2: Update AlertsService to check channel limits**

In `apps/platform/src/modules/alerts/alerts.service.ts`:

Add imports:
```typescript
import { ForbiddenException } from '@nestjs/common';
import { PlanLimitsService } from '../subscription/plan-limits.service';
import { User } from '../../entities/user.entity';
import { Project } from '../projects/project.entity';
```

Update constructor to add:
```typescript
constructor(
  @InjectRepository(Alert) private alertRepo: Repository<Alert>,
  @InjectRepository(Execution) private execRepo: Repository<Execution>,
  @InjectRepository(Job) private jobRepo: Repository<Job>,
  @InjectRepository(Project) private projectRepo: Repository<Project>,
  @InjectRepository(User) private userRepo: Repository<User>,
  private emailNotifier: EmailNotifier,
  private planLimitsService: PlanLimitsService,
) {}
```

Update the `create` method to check channel:

```typescript
async create(projectId: string, dto: CreateAlertDto) {
  // Check alert channel against plan
  const project = await this.projectRepo.findOne({ where: { id: projectId } });
  if (project) {
    const user = await this.userRepo.findOne({ where: { id: project.userId } });
    if (user) {
      const check = this.planLimitsService.checkAlertChannel(user, dto.channel);
      if (!check.allowed) {
        throw new ForbiddenException(check.message);
      }
    }
  }

  const alert = this.alertRepo.create({
    projectId,
    jobId: dto.jobId || undefined,
    channel: dto.channel,
    target: dto.target,
    triggerType: dto.triggerType,
    triggerValue: dto.triggerValue,
    cooldownSeconds: dto.cooldownSeconds ?? 3600,
  });
  return this.alertRepo.save(alert);
}
```

- [ ] **Step 3: Verify build**

Run:
```bash
cd apps/platform && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/modules/alerts/alerts.service.ts apps/platform/src/modules/alerts/alerts.module.ts
git commit -m "feat(subscription): enforce alert channel limits"
```

---

## Task 12: Add dashboard subscription hook and billing section

**Files:**
- Create: `apps/dashboard/lib/hooks/use-subscription.ts`
- Modify: `apps/dashboard/app/(dashboard)/[projectId]/settings/page.tsx`

- [ ] **Step 1: Create the subscription hook**

Create `apps/dashboard/lib/hooks/use-subscription.ts`:

```typescript
"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";

export interface UsageData {
  plan: "free" | "pro" | "team";
  projects: { used: number; limit: number };
  jobs: { used: number; limit: number };
  executions: { used: number; limit: number; resetsAt: string };
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription", "usage"],
    queryFn: () => apiClient.get<UsageData>("/api/v1/subscription/usage"),
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async (plan: "pro" | "team") => {
      const result = await apiClient.post<{ url: string }>(
        "/api/v1/subscription/checkout",
        { plan },
      );
      window.location.href = result.url;
      return result;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: async () => {
      const result = await apiClient.get<{ url: string }>(
        "/api/v1/subscription/portal",
      );
      window.location.href = result.url;
      return result;
    },
  });
}
```

- [ ] **Step 2: Add Plan & Billing section to settings page**

In `apps/dashboard/app/(dashboard)/[projectId]/settings/page.tsx`, add the import:

```typescript
import { useSubscription, useCheckout, usePortal } from "@/lib/hooks/use-subscription";
```

Inside the component, add the hooks:

```typescript
const { data: usage } = useSubscription();
const checkout = useCheckout();
const portal = usePortal();
```

Add a "Plan & Billing" section after the "Project Overview" section. This section renders:

```tsx
{/* Plan & Billing */}
<div className="rounded-lg border border-[var(--border)]">
  <div className="p-4 border-b border-[var(--border)]">
    <h3 className="text-sm font-medium">Plan & Billing</h3>
  </div>
  <div className="p-4 space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <span className="text-sm font-medium capitalize">{usage?.plan || "free"} Plan</span>
      </div>
      <div className="flex gap-2">
        {usage?.plan !== "team" && (
          <button
            onClick={() => checkout.mutate(usage?.plan === "free" ? "pro" : "team")}
            disabled={checkout.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-full bg-accent text-accent-foreground hover:opacity-90 transition-opacity"
          >
            {checkout.isPending ? "Redirecting..." : `Upgrade to ${usage?.plan === "free" ? "Pro" : "Team"}`}
          </button>
        )}
        {usage?.plan !== "free" && (
          <button
            onClick={() => portal.mutate()}
            disabled={portal.isPending}
            className="text-xs font-medium px-3 py-1.5 rounded-full border hover:bg-muted transition-colors"
          >
            {portal.isPending ? "Redirecting..." : "Manage Billing"}
          </button>
        )}
      </div>
    </div>

    {usage && (
      <div className="space-y-3">
        <UsageBar label="Projects" used={usage.projects.used} limit={usage.projects.limit} />
        <UsageBar label="Jobs" used={usage.jobs.used} limit={usage.jobs.limit} />
        <UsageBar label="Executions" used={usage.executions.used} limit={usage.executions.limit} />
      </div>
    )}
  </div>
</div>
```

Add the `UsageBar` component at the bottom of the file (or above the default export):

```tsx
function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percentage = limit === Infinity ? 0 : Math.min((used / limit) * 100, 100);
  const color =
    percentage >= 100 ? "bg-red-500" : percentage >= 80 ? "bg-amber-500" : "bg-emerald-500";
  const limitDisplay = limit === Infinity ? "Unlimited" : limit.toLocaleString();

  return (
    <div>
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{label}</span>
        <span>{used.toLocaleString()} / {limitDisplay}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${limit === Infinity ? 0 : percentage}%` }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify dashboard builds**

Run:
```bash
cd apps/dashboard && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/lib/hooks/use-subscription.ts apps/dashboard/app/\(dashboard\)/\[projectId\]/settings/page.tsx
git commit -m "feat(dashboard): add plan & billing section with usage bars"
```

---

## Task 13: Add upgrade banner component

**Files:**
- Create: `apps/dashboard/components/upgrade-banner.tsx`

- [ ] **Step 1: Create the upgrade banner**

Create `apps/dashboard/components/upgrade-banner.tsx`:

```tsx
"use client";

import { useSubscription, useCheckout } from "@/lib/hooks/use-subscription";

export function UpgradeBanner() {
  const { data: usage } = useSubscription();
  const checkout = useCheckout();

  if (!usage || usage.plan === "team") return null;

  const warnings: string[] = [];

  const checkLimit = (label: string, used: number, limit: number) => {
    if (limit === Infinity) return;
    const pct = (used / limit) * 100;
    if (pct >= 80) warnings.push(`${Math.round(pct)}% of ${label.toLowerCase()}`);
  };

  checkLimit("Projects", usage.projects.used, usage.projects.limit);
  checkLimit("Jobs", usage.jobs.used, usage.jobs.limit);
  checkLimit("Executions", usage.executions.used, usage.executions.limit);

  if (warnings.length === 0) return null;

  const nextPlan = usage.plan === "free" ? "pro" : "team";

  return (
    <div className="mx-4 mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
      <p className="text-xs text-amber-600 dark:text-amber-400">
        You&apos;ve used {warnings.join(", ")}. Consider upgrading for higher limits.
      </p>
      <button
        onClick={() => checkout.mutate(nextPlan as "pro" | "team")}
        disabled={checkout.isPending}
        className="text-xs font-medium px-3 py-1 rounded-full bg-amber-500 text-white hover:bg-amber-600 transition-colors shrink-0 ml-3"
      >
        {checkout.isPending ? "..." : `Upgrade to ${nextPlan}`}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Add the banner to the dashboard layout**

Find the dashboard layout file (likely `apps/dashboard/app/(dashboard)/layout.tsx`) and add the `UpgradeBanner` component near the top of the page content area:

```tsx
import { UpgradeBanner } from "@/components/upgrade-banner";
```

Place `<UpgradeBanner />` at the top of the main content area, before `{children}`.

- [ ] **Step 3: Verify dashboard builds**

Run:
```bash
cd apps/dashboard && npm run build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add apps/dashboard/components/upgrade-banner.tsx apps/dashboard/app/\(dashboard\)/layout.tsx
git commit -m "feat(dashboard): add upgrade warning banner"
```

---

## Task 14: Update website pricing CTA buttons

**Files:**
- Modify: `apps/website/components/pricing.tsx:114-126`

- [ ] **Step 1: Update the pricing CTA buttons**

In `apps/website/components/pricing.tsx`, update the tier data to include a CTA action:

Replace the existing tiers array with:

```typescript
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
    cta: "Get Started",
    href: "https://app.pingback.lol/register",
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
    cta: "Upgrade to Pro",
    href: "https://app.pingback.lol/register?plan=pro",
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
    cta: "Upgrade to Team",
    href: "https://app.pingback.lol/register?plan=team",
  },
];
```

Update the Link component at the bottom of each tier card:

```tsx
<Link
  href={tier.href}
  className={`text-sm font-medium text-center py-2.5 rounded-full transition-opacity ${
    tier.highlight
      ? "bg-accent text-accent-foreground hover:opacity-90"
      : "border hover:bg-muted"
  }`}
>
  {tier.cta}
</Link>
```

- [ ] **Step 2: Verify website builds**

Run:
```bash
cd apps/website && npm run build
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/website/components/pricing.tsx
git commit -m "feat(website): update pricing CTAs with plan-specific links"
```

---

## Task 15: Run all tests and verify

**Files:** None (verification only)

- [ ] **Step 1: Run all platform tests**

Run:
```bash
cd apps/platform && npm test
```
Expected: All tests PASS.

- [ ] **Step 2: Build all apps**

Run:
```bash
npm run build
```
Expected: All apps build successfully.

- [ ] **Step 3: Verify no lint errors**

Run:
```bash
npm run lint
```
Expected: No errors.
