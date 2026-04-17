# Phase 1: Platform API Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete platform backend — auth, CRUD APIs, SDK registration, pgboss queue, scheduler, worker, and alerts — to make Pingback functional end-to-end.

**Architecture:** Hybrid module approach — domain modules (auth, projects, jobs, alerts) for business logic, infrastructure modules (queue, scheduler, worker) for cross-cutting concerns. All run in a single NestJS process. pgboss on PostgreSQL replaces BullMQ + Redis.

**Tech Stack:** NestJS 10, TypeORM, PostgreSQL, pgboss, Passport (JWT + GitHub OAuth + custom API key), bcrypt, cron-parser, Resend, class-validator

---

## File Map

### Existing files (to modify)
- `apps/platform/package.json` — swap bullmq/ioredis for pg-boss
- `apps/platform/src/app.module.ts` — import all new modules
- `apps/platform/src/entities/user.entity.ts` — add `refreshToken` column
- `apps/platform/src/modules/jobs/job.entity.ts` — make `schedule` nullable for task-type jobs

### New files (by task)

**Task 1 — Dependencies & Entity changes:**
- (modifications only, listed above)

**Task 2 — Auth module:**
- `apps/platform/src/modules/auth/auth.module.ts`
- `apps/platform/src/modules/auth/auth.controller.ts`
- `apps/platform/src/modules/auth/auth.service.ts`
- `apps/platform/src/modules/auth/jwt.strategy.ts`
- `apps/platform/src/modules/auth/jwt-auth.guard.ts`
- `apps/platform/src/modules/auth/github.strategy.ts`
- `apps/platform/src/modules/auth/api-key.strategy.ts`
- `apps/platform/src/modules/auth/api-key.guard.ts`
- `apps/platform/src/modules/auth/dto/register.dto.ts`
- `apps/platform/src/modules/auth/dto/login.dto.ts`
- `apps/platform/src/modules/auth/auth.service.spec.ts`

**Task 3 — Projects module:**
- `apps/platform/src/modules/projects/projects.module.ts`
- `apps/platform/src/modules/projects/projects.controller.ts`
- `apps/platform/src/modules/projects/projects.service.ts`
- `apps/platform/src/modules/projects/dto/create-project.dto.ts`
- `apps/platform/src/modules/projects/projects.service.spec.ts`

**Task 4 — API Keys module:**
- `apps/platform/src/modules/api-keys/api-keys.controller.ts`
- `apps/platform/src/modules/api-keys/api-keys.service.ts`
- `apps/platform/src/modules/api-keys/dto/create-api-key.dto.ts`
- `apps/platform/src/modules/api-keys/api-keys.service.spec.ts`

**Task 5 — Jobs module:**
- `apps/platform/src/modules/jobs/jobs.module.ts`
- `apps/platform/src/modules/jobs/jobs.controller.ts`
- `apps/platform/src/modules/jobs/jobs.service.ts`
- `apps/platform/src/modules/jobs/dto/create-job.dto.ts`
- `apps/platform/src/modules/jobs/dto/update-job.dto.ts`
- `apps/platform/src/modules/jobs/jobs.service.spec.ts`

**Task 6 — Executions & Logs:**
- `apps/platform/src/modules/executions/executions.module.ts`
- `apps/platform/src/modules/executions/executions.controller.ts`
- `apps/platform/src/modules/executions/executions.service.ts`
- `apps/platform/src/modules/executions/logs.controller.ts`
- `apps/platform/src/modules/executions/logs.service.ts`
- `apps/platform/src/modules/executions/executions.service.spec.ts`

**Task 7 — Registration:**
- `apps/platform/src/modules/projects/registration.controller.ts`
- `apps/platform/src/modules/projects/registration.service.ts`
- `apps/platform/src/modules/projects/dto/register.dto.ts`
- `apps/platform/src/modules/projects/registration.service.spec.ts`

**Task 8 — Queue module (pgboss):**
- `apps/platform/src/modules/queue/queue.module.ts`
- `apps/platform/src/modules/queue/queue.service.ts`
- `apps/platform/src/modules/queue/queue.service.spec.ts`

**Task 9 — Scheduler:**
- `apps/platform/src/modules/scheduler/scheduler.module.ts`
- `apps/platform/src/modules/scheduler/scheduler.service.ts`
- `apps/platform/src/modules/scheduler/scheduler.service.spec.ts`

**Task 10 — Worker:**
- `apps/platform/src/modules/worker/worker.module.ts`
- `apps/platform/src/modules/worker/worker.service.ts`
- `apps/platform/src/modules/worker/worker.service.spec.ts`

**Task 11 — Alerts:**
- `apps/platform/src/modules/alerts/alerts.module.ts`
- `apps/platform/src/modules/alerts/alerts.controller.ts`
- `apps/platform/src/modules/alerts/alerts.service.ts`
- `apps/platform/src/modules/alerts/notifiers/email.notifier.ts`
- `apps/platform/src/modules/alerts/dto/create-alert.dto.ts`
- `apps/platform/src/modules/alerts/dto/update-alert.dto.ts`
- `apps/platform/src/modules/alerts/alerts.service.spec.ts`

**Task 12 — App module wiring:**
- (modification to `app.module.ts` only)

---

## Task 1: Dependencies & Entity Changes

**Files:**
- Modify: `apps/platform/package.json`
- Modify: `apps/platform/src/entities/user.entity.ts`
- Modify: `apps/platform/src/modules/jobs/job.entity.ts`

- [ ] **Step 1: Swap BullMQ/Redis for pgboss in package.json**

In `apps/platform/package.json`, remove these three dependencies:
```
"@nestjs/bullmq": "^10.2.0",
"bullmq": "^5.12.0",
"ioredis": "^5.4.0",
```

Add:
```
"pg-boss": "^10.1.0"
```

- [ ] **Step 2: Install dependencies**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback && npm install`
Expected: clean install, no errors

- [ ] **Step 3: Add refreshToken column to User entity**

In `apps/platform/src/entities/user.entity.ts`, add after the `avatarUrl` column:

```typescript
@Column({ type: 'text', nullable: true, name: 'refresh_token' })
refreshToken: string;
```

- [ ] **Step 4: Make Job.schedule nullable for task-type functions**

In `apps/platform/src/modules/jobs/job.entity.ts`, change the schedule column from:
```typescript
@Column({ type: 'text' })
schedule: string;
```
to:
```typescript
@Column({ type: 'text', nullable: true })
schedule: string;
```

- [ ] **Step 5: Remove redis config from configuration.ts**

In `apps/platform/src/config/configuration.ts`, remove the `redis` block:
```typescript
redis: {
  url: process.env.REDIS_URL,
},
```

- [ ] **Step 6: Commit**

```bash
git add apps/platform/package.json apps/platform/src/entities/user.entity.ts apps/platform/src/modules/jobs/job.entity.ts apps/platform/src/config/configuration.ts package-lock.json
git commit -m "chore: swap bullmq/redis for pg-boss, update entities for auth and task-type jobs"
```

---

## Task 2: Auth Module

**Files:**
- Create: `apps/platform/src/modules/auth/dto/register.dto.ts`
- Create: `apps/platform/src/modules/auth/dto/login.dto.ts`
- Create: `apps/platform/src/modules/auth/auth.service.ts`
- Create: `apps/platform/src/modules/auth/auth.service.spec.ts`
- Create: `apps/platform/src/modules/auth/jwt.strategy.ts`
- Create: `apps/platform/src/modules/auth/jwt-auth.guard.ts`
- Create: `apps/platform/src/modules/auth/github.strategy.ts`
- Create: `apps/platform/src/modules/auth/api-key.strategy.ts`
- Create: `apps/platform/src/modules/auth/api-key.guard.ts`
- Create: `apps/platform/src/modules/auth/auth.controller.ts`
- Create: `apps/platform/src/modules/auth/auth.module.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/platform/src/modules/auth/dto/register.dto.ts`:
```typescript
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

Create `apps/platform/src/modules/auth/dto/login.dto.ts`:
```typescript
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}
```

- [ ] **Step 2: Write failing tests for AuthService**

Create `apps/platform/src/modules/auth/auth.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../entities/user.entity';

describe('AuthService', () => {
  let service: AuthService;
  let userRepo: Record<string, jest.Mock>;
  let jwtService: Record<string, jest.Mock>;

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('mock-token'),
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  describe('register', () => {
    it('should create a user and return tokens', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({ id: 'user-1', email: 'test@test.com' });
      userRepo.save.mockResolvedValue({ id: 'user-1', email: 'test@test.com' });

      const result = await service.register({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if email exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'user-1' });

      await expect(
        service.register({ email: 'test@test.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const hash = await bcrypt.hash('password123', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });

      const result = await service.login({
        email: 'test@test.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      const hash = await bcrypt.hash('password123', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        passwordHash: hash,
      });

      await expect(
        service.login({ email: 'test@test.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for unknown email', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@test.com', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens for valid refresh token', async () => {
      const hash = await bcrypt.hash('valid-refresh', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        email: 'test@test.com',
        refreshToken: hash,
      });

      const result = await service.refreshTokens('user-1', 'valid-refresh');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const hash = await bcrypt.hash('valid-refresh', 10);
      userRepo.findOne.mockResolvedValue({
        id: 'user-1',
        refreshToken: hash,
      });

      await expect(
        service.refreshTokens('user-1', 'invalid-refresh'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findOrCreateGithubUser', () => {
    it('should return existing user by githubId', async () => {
      const existing = { id: 'user-1', githubId: '12345', email: 'gh@test.com' };
      userRepo.findOne.mockResolvedValue(existing);

      const result = await service.findOrCreateGithubUser({
        githubId: '12345',
        email: 'gh@test.com',
        name: 'GH User',
        avatarUrl: 'https://avatar.url',
      });

      expect(result.id).toBe('user-1');
    });

    it('should create new user if githubId not found', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue({
        id: 'user-2',
        githubId: '12345',
        email: 'gh@test.com',
      });
      userRepo.save.mockResolvedValue({
        id: 'user-2',
        githubId: '12345',
        email: 'gh@test.com',
      });

      const result = await service.findOrCreateGithubUser({
        githubId: '12345',
        email: 'gh@test.com',
        name: 'GH User',
        avatarUrl: 'https://avatar.url',
      });

      expect(result.id).toBe('user-2');
      expect(userRepo.save).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/auth/auth.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './auth.service'`

- [ ] **Step 4: Implement AuthService**

Create `apps/platform/src/modules/auth/auth.service.ts`:
```typescript
import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../../entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepo.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
    });
    await this.userRepo.save(user);

    return this.generateTokens(user);
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const valid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!valid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return this.generateTokens(user);
  }

  async findOrCreateGithubUser(profile: {
    githubId: string;
    email: string;
    name: string;
    avatarUrl: string;
  }): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: { githubId: profile.githubId },
    });
    if (existing) return existing;

    const user = this.userRepo.create({
      githubId: profile.githubId,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.avatarUrl,
    });
    return this.userRepo.save(user);
  }

  async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    const refreshHash = await bcrypt.hash(refreshToken, 10);
    await this.userRepo.save({ ...user, refreshToken: refreshHash });

    return { accessToken, refreshToken };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/auth/auth.service.spec.ts --no-cache`
Expected: All 7 tests pass

- [ ] **Step 6: Create JWT strategy and guard**

Create `apps/platform/src/modules/auth/jwt.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('jwt.secret'),
    });
  }

  validate(payload: { sub: string; email: string }) {
    return { id: payload.sub, email: payload.email };
  }
}
```

Create `apps/platform/src/modules/auth/jwt-auth.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

- [ ] **Step 7: Create GitHub OAuth strategy**

Create `apps/platform/src/modules/auth/github.strategy.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: config.get<string>('github.clientId'),
      clientSecret: config.get<string>('github.clientSecret'),
      callbackURL: '/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ) {
    const email =
      profile.emails?.[0]?.value || `${profile.id}@github.pingback.dev`;
    return this.authService.findOrCreateGithubUser({
      githubId: String(profile.id),
      email,
      name: profile.displayName || profile.username,
      avatarUrl: profile.photos?.[0]?.value || '',
    });
  }
}
```

- [ ] **Step 8: Create API key strategy and guard**

Create `apps/platform/src/modules/auth/api-key.strategy.ts`:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-http-bearer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ApiKey } from '../api-keys/api-key.entity';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {
    super();
  }

  async validate(token: string) {
    if (!token.startsWith('pb_live_')) {
      throw new UnauthorizedException('Invalid API key format');
    }

    const prefix = token.substring(0, 16);
    const candidates = await this.apiKeyRepo.find({
      where: { keyPrefix: prefix },
      relations: ['project', 'project.user'],
    });

    for (const candidate of candidates) {
      const valid = await bcrypt.compare(token, candidate.keyHash);
      if (valid) {
        await this.apiKeyRepo.update(candidate.id, { lastUsedAt: new Date() });
        return {
          project: candidate.project,
          user: candidate.project.user,
          apiKeyId: candidate.id,
        };
      }
    }

    throw new UnauthorizedException('Invalid API key');
  }
}
```

Create `apps/platform/src/modules/auth/api-key.guard.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyGuard extends AuthGuard('api-key') {}
```

Note: This requires `passport-http-bearer`. Add it in the install step.

- [ ] **Step 9: Add passport-http-bearer dependency**

In `apps/platform/package.json`, add to dependencies:
```
"passport-http-bearer": "^1.0.1"
```

Add to devDependencies:
```
"@types/passport-http-bearer": "^1.0.0"
```

Run: `cd /Users/cirx/Desktop/projects/personal/pingback && npm install`

- [ ] **Step 10: Create AuthController**

Create `apps/platform/src/modules/auth/auth.controller.ts`:
```typescript
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  refresh(@Req() req: Request, @Body('refreshToken') refreshToken: string) {
    const user = req.user as { id: string };
    return this.authService.refreshTokens(user.id, refreshToken);
  }

  @UseGuards(AuthGuard('github'))
  @Get('github')
  github() {
    // Passport redirects to GitHub
  }

  @UseGuards(AuthGuard('github'))
  @Get('github/callback')
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const user = req.user as any;
    const tokens = await this.authService.generateTokens(user);
    const params = new URLSearchParams({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
    res.redirect(`${process.env.DASHBOARD_URL || 'http://localhost:3000'}/auth/callback?${params}`);
  }
}
```

- [ ] **Step 11: Create AuthModule**

Create `apps/platform/src/modules/auth/auth.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../../entities/user.entity';
import { ApiKey } from '../api-keys/api-key.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GithubStrategy } from './github.strategy';
import { ApiKeyStrategy } from './api-key.strategy';
import { ApiKeyGuard } from './api-key.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ApiKey]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    GithubStrategy,
    ApiKeyStrategy,
    ApiKeyGuard,
  ],
  exports: [AuthService, JwtAuthGuard, ApiKeyGuard],
})
export class AuthModule {}
```

- [ ] **Step 12: Run tests**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/auth/ --no-cache`
Expected: All tests pass

- [ ] **Step 13: Commit**

```bash
git add apps/platform/src/modules/auth/
git commit -m "feat(auth): add auth module with JWT, GitHub OAuth, and API key strategies"
```

---

## Task 3: Projects Module

**Files:**
- Create: `apps/platform/src/modules/projects/dto/create-project.dto.ts`
- Create: `apps/platform/src/modules/projects/projects.service.ts`
- Create: `apps/platform/src/modules/projects/projects.service.spec.ts`
- Create: `apps/platform/src/modules/projects/projects.controller.ts`
- Create: `apps/platform/src/modules/projects/projects.module.ts`

- [ ] **Step 1: Create DTO**

Create `apps/platform/src/modules/projects/dto/create-project.dto.ts`:
```typescript
import { IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsUrl()
  endpointUrl: string;

  @IsString()
  @IsOptional()
  domain?: string;
}
```

- [ ] **Step 2: Write failing tests for ProjectsService**

Create `apps/platform/src/modules/projects/projects.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';

describe('ProjectsService', () => {
  let service: ProjectsService;
  let projectRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    projectRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: getRepositoryToken(Project), useValue: projectRepo },
      ],
    }).compile();

    service = module.get(ProjectsService);
  });

  describe('create', () => {
    it('should create a project with a generated cron secret', async () => {
      projectRepo.create.mockReturnValue({ id: 'proj-1', name: 'My App' });
      projectRepo.save.mockResolvedValue({ id: 'proj-1', name: 'My App' });

      const result = await service.create('user-1', {
        name: 'My App',
        endpointUrl: 'https://myapp.com/api/__pingback',
      });

      expect(result).toHaveProperty('id');
      expect(projectRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-1',
          name: 'My App',
          cronSecret: expect.any(String),
        }),
      );
    });
  });

  describe('findAllByUser', () => {
    it('should return projects for the given user', async () => {
      projectRepo.find.mockResolvedValue([{ id: 'proj-1' }]);

      const result = await service.findAllByUser('user-1');

      expect(projectRepo.find).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOneByUser', () => {
    it('should return the project', async () => {
      projectRepo.findOne.mockResolvedValue({ id: 'proj-1', userId: 'user-1' });

      const result = await service.findOneByUser('proj-1', 'user-1');

      expect(result.id).toBe('proj-1');
    });

    it('should throw NotFoundException if not found', async () => {
      projectRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOneByUser('proj-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete the project', async () => {
      projectRepo.findOne.mockResolvedValue({ id: 'proj-1', userId: 'user-1' });
      projectRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove('proj-1', 'user-1');

      expect(projectRepo.delete).toHaveBeenCalledWith('proj-1');
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/projects/projects.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './projects.service'`

- [ ] **Step 4: Implement ProjectsService**

Create `apps/platform/src/modules/projects/projects.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Project } from './project.entity';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepo: Repository<Project>,
  ) {}

  async create(userId: string, dto: CreateProjectDto) {
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

  async findAllByUser(userId: string) {
    return this.projectRepo.find({ where: { userId } });
  }

  async findOneByUser(id: string, userId: string) {
    const project = await this.projectRepo.findOne({
      where: { id, userId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async remove(id: string, userId: string) {
    await this.findOneByUser(id, userId);
    await this.projectRepo.delete(id);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/projects/projects.service.spec.ts --no-cache`
Expected: All 4 tests pass

- [ ] **Step 6: Create ProjectsController**

Create `apps/platform/src/modules/projects/projects.controller.ts`:
```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const user = req.user as { id: string };
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.projectsService.findAllByUser(user.id);
  }

  @Get(':projectId')
  findOne(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.projectsService.findOneByUser(projectId, user.id);
  }

  @Delete(':projectId')
  remove(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.projectsService.remove(projectId, user.id);
  }
}
```

- [ ] **Step 7: Create ProjectsModule**

Create `apps/platform/src/modules/projects/projects.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

- [ ] **Step 8: Commit**

```bash
git add apps/platform/src/modules/projects/
git commit -m "feat(projects): add projects module with CRUD and cron secret generation"
```

---

## Task 4: API Keys Module

**Files:**
- Create: `apps/platform/src/modules/api-keys/dto/create-api-key.dto.ts`
- Create: `apps/platform/src/modules/api-keys/api-keys.service.ts`
- Create: `apps/platform/src/modules/api-keys/api-keys.service.spec.ts`
- Create: `apps/platform/src/modules/api-keys/api-keys.controller.ts`

- [ ] **Step 1: Create DTO**

Create `apps/platform/src/modules/api-keys/dto/create-api-key.dto.ts`:
```typescript
import { IsString } from 'class-validator';

export class CreateApiKeyDto {
  @IsString()
  name: string;
}
```

- [ ] **Step 2: Write failing tests for ApiKeysService**

Create `apps/platform/src/modules/api-keys/api-keys.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ApiKeysService } from './api-keys.service';
import { ApiKey } from './api-key.entity';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let apiKeyRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    apiKeyRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      delete: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ApiKeysService,
        { provide: getRepositoryToken(ApiKey), useValue: apiKeyRepo },
      ],
    }).compile();

    service = module.get(ApiKeysService);
  });

  describe('create', () => {
    it('should generate a key with pb_live_ prefix and return the full key', async () => {
      apiKeyRepo.create.mockReturnValue({ id: 'key-1' });
      apiKeyRepo.save.mockResolvedValue({ id: 'key-1' });

      const result = await service.create('proj-1', { name: 'My Key' });

      expect(result.key).toMatch(/^pb_live_/);
      expect(result).toHaveProperty('id');
      expect(apiKeyRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          name: 'My Key',
          keyPrefix: expect.stringMatching(/^pb_live_/),
          keyHash: expect.any(String),
        }),
      );
    });
  });

  describe('findAllByProject', () => {
    it('should return keys without hashes', async () => {
      apiKeyRepo.find.mockResolvedValue([
        { id: 'key-1', name: 'My Key', keyPrefix: 'pb_live_abc12345', createdAt: new Date() },
      ]);

      const result = await service.findAllByProject('proj-1');

      expect(result).toHaveLength(1);
      expect(result[0]).not.toHaveProperty('keyHash');
    });
  });

  describe('revoke', () => {
    it('should delete the key', async () => {
      apiKeyRepo.delete.mockResolvedValue({ affected: 1 });

      await service.revoke('key-1', 'proj-1');

      expect(apiKeyRepo.delete).toHaveBeenCalledWith({
        id: 'key-1',
        projectId: 'proj-1',
      });
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/api-keys/api-keys.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './api-keys.service'`

- [ ] **Step 4: Implement ApiKeysService**

Create `apps/platform/src/modules/api-keys/api-keys.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from './api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async create(projectId: string, dto: CreateApiKeyDto) {
    const raw = `pb_live_${randomBytes(32).toString('hex')}`;
    const prefix = raw.substring(0, 16);
    const keyHash = await bcrypt.hash(raw, 10);

    const apiKey = this.apiKeyRepo.create({
      projectId,
      name: dto.name,
      keyPrefix: prefix,
      keyHash,
    });
    const saved = await this.apiKeyRepo.save(apiKey);

    return { id: saved.id, name: saved.name, key: raw, keyPrefix: prefix };
  }

  async findAllByProject(projectId: string) {
    const keys = await this.apiKeyRepo.find({ where: { projectId } });
    return keys.map(({ keyHash, ...rest }) => rest);
  }

  async revoke(id: string, projectId: string) {
    await this.apiKeyRepo.delete({ id, projectId });
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/api-keys/api-keys.service.spec.ts --no-cache`
Expected: All 3 tests pass

- [ ] **Step 6: Create ApiKeysController**

Create `apps/platform/src/modules/api-keys/api-keys.controller.ts`:
```typescript
import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/api-keys')
export class ApiKeysController {
  constructor(
    private apiKeysService: ApiKeysService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: CreateApiKeyDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.apiKeysService.create(projectId, dto);
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.apiKeysService.findAllByProject(projectId);
  }

  @Delete(':id')
  async revoke(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.apiKeysService.revoke(id, projectId);
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add apps/platform/src/modules/api-keys/
git commit -m "feat(api-keys): add API key generation, listing, and revocation"
```

---

## Task 5: Jobs Module

**Files:**
- Create: `apps/platform/src/modules/jobs/dto/create-job.dto.ts`
- Create: `apps/platform/src/modules/jobs/dto/update-job.dto.ts`
- Create: `apps/platform/src/modules/jobs/jobs.service.ts`
- Create: `apps/platform/src/modules/jobs/jobs.service.spec.ts`
- Create: `apps/platform/src/modules/jobs/jobs.controller.ts`
- Create: `apps/platform/src/modules/jobs/jobs.module.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/platform/src/modules/jobs/dto/create-job.dto.ts`:
```typescript
import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';

export class CreateJobDto {
  @IsString()
  name: string;

  @IsString()
  schedule: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  retries?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(300)
  timeoutSeconds?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  concurrency?: number;
}
```

Create `apps/platform/src/modules/jobs/dto/update-job.dto.ts`:
```typescript
import { IsString, IsOptional, IsInt, IsEnum, Min, Max } from 'class-validator';

export class UpdateJobDto {
  @IsString()
  @IsOptional()
  schedule?: string;

  @IsEnum(['active', 'paused'])
  @IsOptional()
  status?: 'active' | 'paused';

  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(10)
  retries?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(300)
  timeoutSeconds?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  concurrency?: number;
}
```

- [ ] **Step 2: Write failing tests for JobsService**

Create `apps/platform/src/modules/jobs/jobs.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './job.entity';

describe('JobsService', () => {
  let service: JobsService;
  let jobRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    jobRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: jobRepo },
      ],
    }).compile();

    service = module.get(JobsService);
  });

  describe('create', () => {
    it('should create a manual job with next_run_at calculated', async () => {
      jobRepo.create.mockReturnValue({ id: 'job-1', name: 'test-job' });
      jobRepo.save.mockResolvedValue({ id: 'job-1', name: 'test-job' });

      const result = await service.create('proj-1', {
        name: 'test-job',
        schedule: '*/15 * * * *',
      });

      expect(result).toHaveProperty('id');
      expect(jobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'proj-1',
          name: 'test-job',
          schedule: '*/15 * * * *',
          source: 'manual',
          nextRunAt: expect.any(Date),
        }),
      );
    });

    it('should throw for invalid cron expression', async () => {
      await expect(
        service.create('proj-1', { name: 'bad-job', schedule: 'not-a-cron' }),
      ).rejects.toThrow();
    });
  });

  describe('findOne', () => {
    it('should return the job', async () => {
      jobRepo.findOne.mockResolvedValue({ id: 'job-1', projectId: 'proj-1' });

      const result = await service.findOne('job-1', 'proj-1');

      expect(result.id).toBe('job-1');
    });

    it('should throw NotFoundException if not found', async () => {
      jobRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('job-1', 'proj-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update schedule and recalculate next_run_at', async () => {
      const existing = {
        id: 'job-1',
        projectId: 'proj-1',
        schedule: '*/15 * * * *',
        status: 'active',
      };
      jobRepo.findOne.mockResolvedValue(existing);
      jobRepo.save.mockResolvedValue({ ...existing, schedule: '*/30 * * * *' });

      const result = await service.update('job-1', 'proj-1', {
        schedule: '*/30 * * * *',
      });

      expect(jobRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          schedule: '*/30 * * * *',
          nextRunAt: expect.any(Date),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should hard delete manual jobs', async () => {
      jobRepo.findOne.mockResolvedValue({
        id: 'job-1',
        projectId: 'proj-1',
        source: 'manual',
      });
      jobRepo.delete.mockResolvedValue({ affected: 1 });

      await service.remove('job-1', 'proj-1');

      expect(jobRepo.delete).toHaveBeenCalledWith('job-1');
    });

    it('should set SDK jobs to inactive instead of deleting', async () => {
      const sdkJob = {
        id: 'job-1',
        projectId: 'proj-1',
        source: 'sdk',
        status: 'active',
      };
      jobRepo.findOne.mockResolvedValue(sdkJob);
      jobRepo.save.mockResolvedValue({ ...sdkJob, status: 'inactive' });

      await service.remove('job-1', 'proj-1');

      expect(jobRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'inactive' }),
      );
      expect(jobRepo.delete).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/jobs/jobs.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './jobs.service'`

- [ ] **Step 4: Implement JobsService**

Create `apps/platform/src/modules/jobs/jobs.service.ts`:
```typescript
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { parseExpression } from 'cron-parser';
import { Job } from './job.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@Injectable()
export class JobsService {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
  ) {}

  computeNextRunAt(schedule: string): Date {
    try {
      const interval = parseExpression(schedule);
      return interval.next().toDate();
    } catch {
      throw new BadRequestException(`Invalid cron expression: ${schedule}`);
    }
  }

  async create(projectId: string, dto: CreateJobDto) {
    const nextRunAt = this.computeNextRunAt(dto.schedule);
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

  async findAllByProject(
    projectId: string,
    filters?: { status?: string; type?: string },
  ) {
    const qb = this.jobRepo
      .createQueryBuilder('job')
      .where('job.project_id = :projectId', { projectId });

    if (filters?.status) {
      qb.andWhere('job.status = :status', { status: filters.status });
    }
    if (filters?.type === 'cron') {
      qb.andWhere('job.schedule IS NOT NULL');
    } else if (filters?.type === 'task') {
      qb.andWhere('job.schedule IS NULL');
    }

    return qb.orderBy('job.created_at', 'DESC').getMany();
  }

  async findOne(id: string, projectId: string) {
    const job = await this.jobRepo.findOne({
      where: { id, projectId },
    });
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  async update(id: string, projectId: string, dto: UpdateJobDto) {
    const job = await this.findOne(id, projectId);

    if (dto.schedule) {
      job.schedule = dto.schedule;
      job.nextRunAt = this.computeNextRunAt(dto.schedule);
    }
    if (dto.status) job.status = dto.status;
    if (dto.retries !== undefined) job.retries = dto.retries;
    if (dto.timeoutSeconds !== undefined) job.timeoutSeconds = dto.timeoutSeconds;
    if (dto.concurrency !== undefined) job.concurrency = dto.concurrency;

    return this.jobRepo.save(job);
  }

  async remove(id: string, projectId: string) {
    const job = await this.findOne(id, projectId);
    if (job.source === 'sdk') {
      job.status = 'inactive';
      return this.jobRepo.save(job);
    }
    await this.jobRepo.delete(id);
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/jobs/jobs.service.spec.ts --no-cache`
Expected: All 6 tests pass

- [ ] **Step 6: Create JobsController**

Create `apps/platform/src/modules/jobs/jobs.controller.ts`:
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';

@UseGuards(ApiKeyGuard)
@Controller('api/v1/jobs')
export class JobsApiController {
  constructor(private jobsService: JobsService) {}

  @Post()
  create(@Req() req: Request, @Body() dto: CreateJobDto) {
    const { project } = req.user as any;
    return this.jobsService.create(project.id, dto);
  }

  @Get()
  findAll(@Req() req: Request, @Query('status') status?: string) {
    const { project } = req.user as any;
    return this.jobsService.findAllByProject(project.id, { status });
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param('id') id: string) {
    const { project } = req.user as any;
    return this.jobsService.findOne(id, project.id);
  }

  @Patch(':id')
  update(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    const { project } = req.user as any;
    return this.jobsService.update(id, project.id, dto);
  }

  @Delete(':id')
  remove(@Req() req: Request, @Param('id') id: string) {
    const { project } = req.user as any;
    return this.jobsService.remove(id, project.id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/jobs')
export class JobsDashboardController {
  constructor(
    private jobsService: JobsService,
    private projectsService: ProjectsService,
  ) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.findAllByProject(projectId, { status, type });
  }

  @Get(':id')
  async findOne(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.findOne(id, projectId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.update(id, projectId, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.jobsService.remove(id, projectId);
  }

  @Post(':id/run')
  async triggerRun(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    // Delegates to queue — implemented in Task 8 after QueueService exists
    const job = await this.jobsService.findOne(id, projectId);
    return { message: 'Run triggered', jobId: job.id };
  }
}
```

- [ ] **Step 7: Create JobsModule**

Create `apps/platform/src/modules/jobs/jobs.module.ts`:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from './job.entity';
import { JobsService } from './jobs.service';
import { JobsApiController, JobsDashboardController } from './jobs.controller';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Job]),
    ProjectsModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [JobsApiController, JobsDashboardController],
  providers: [JobsService],
  exports: [JobsService],
})
export class JobsModule {}
```

- [ ] **Step 8: Commit**

```bash
git add apps/platform/src/modules/jobs/
git commit -m "feat(jobs): add jobs module with CRUD, cron parsing, and dual API/dashboard controllers"
```

---

## Task 6: Executions & Logs

**Files:**
- Create: `apps/platform/src/modules/executions/executions.service.ts`
- Create: `apps/platform/src/modules/executions/executions.service.spec.ts`
- Create: `apps/platform/src/modules/executions/executions.controller.ts`
- Create: `apps/platform/src/modules/executions/logs.service.ts`
- Create: `apps/platform/src/modules/executions/logs.controller.ts`

- [ ] **Step 1: Write failing tests for ExecutionsService**

Create `apps/platform/src/modules/executions/executions.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ExecutionsService } from './executions.service';
import { Execution } from './execution.entity';

describe('ExecutionsService', () => {
  let service: ExecutionsService;
  let execRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    execRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ExecutionsService,
        { provide: getRepositoryToken(Execution), useValue: execRepo },
      ],
    }).compile();

    service = module.get(ExecutionsService);
  });

  describe('createPending', () => {
    it('should create a pending execution', async () => {
      execRepo.create.mockReturnValue({ id: 'exec-1', status: 'pending' });
      execRepo.save.mockResolvedValue({ id: 'exec-1', status: 'pending' });

      const result = await service.createPending('job-1', new Date());

      expect(result.status).toBe('pending');
      expect(execRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'job-1',
          status: 'pending',
          scheduledAt: expect.any(Date),
        }),
      );
    });
  });

  describe('markRunning', () => {
    it('should set status to running with startedAt', async () => {
      const exec = { id: 'exec-1', status: 'pending' };
      execRepo.findOne.mockResolvedValue(exec);
      execRepo.save.mockResolvedValue({ ...exec, status: 'running' });

      await service.markRunning('exec-1');

      expect(execRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'running',
          startedAt: expect.any(Date),
        }),
      );
    });
  });

  describe('markCompleted', () => {
    it('should set status to success with results', async () => {
      const exec = { id: 'exec-1', status: 'running', startedAt: new Date() };
      execRepo.findOne.mockResolvedValue(exec);
      execRepo.save.mockImplementation((e) => Promise.resolve(e));

      await service.markCompleted('exec-1', {
        status: 'success',
        httpStatus: 200,
        responseBody: '{"ok":true}',
        logs: [{ timestamp: 1, message: 'done' }],
      });

      expect(execRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          httpStatus: 200,
          completedAt: expect.any(Date),
          durationMs: expect.any(Number),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if not found', async () => {
      execRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('exec-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/executions/executions.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './executions.service'`

- [ ] **Step 3: Implement ExecutionsService**

Create `apps/platform/src/modules/executions/executions.service.ts`:
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution } from './execution.entity';

@Injectable()
export class ExecutionsService {
  constructor(
    @InjectRepository(Execution) private execRepo: Repository<Execution>,
  ) {}

  async createPending(jobId: string, scheduledAt: Date, attempt = 1) {
    const exec = this.execRepo.create({
      jobId,
      status: 'pending' as const,
      scheduledAt,
      attempt,
    });
    return this.execRepo.save(exec);
  }

  async markRunning(id: string) {
    const exec = await this.execRepo.findOne({ where: { id } });
    if (!exec) throw new NotFoundException('Execution not found');
    exec.status = 'running';
    exec.startedAt = new Date();
    return this.execRepo.save(exec);
  }

  async markCompleted(
    id: string,
    result: {
      status: 'success' | 'failed';
      httpStatus?: number;
      responseBody?: string;
      errorMessage?: string;
      logs?: Array<{ timestamp: number; message: string }>;
    },
  ) {
    const exec = await this.execRepo.findOne({ where: { id } });
    if (!exec) throw new NotFoundException('Execution not found');

    exec.status = result.status;
    exec.completedAt = new Date();
    exec.durationMs = exec.startedAt
      ? exec.completedAt.getTime() - exec.startedAt.getTime()
      : 0;
    if (result.httpStatus !== undefined) exec.httpStatus = result.httpStatus;
    if (result.responseBody) exec.responseBody = result.responseBody.substring(0, 10240);
    if (result.errorMessage) exec.errorMessage = result.errorMessage;
    if (result.logs) exec.logs = result.logs;

    return this.execRepo.save(exec);
  }

  async findOne(id: string) {
    const exec = await this.execRepo.findOne({
      where: { id },
      relations: ['job'],
    });
    if (!exec) throw new NotFoundException('Execution not found');
    return exec;
  }

  async findByJob(jobId: string, page = 1, limit = 20) {
    const [items, total] = await this.execRepo.findAndCount({
      where: { jobId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async findByProject(
    projectId: string,
    filters?: {
      status?: string;
      jobId?: string;
      dateFrom?: string;
      dateTo?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;

    const qb = this.execRepo
      .createQueryBuilder('exec')
      .innerJoin('exec.job', 'job')
      .where('job.project_id = :projectId', { projectId });

    if (filters?.status) {
      qb.andWhere('exec.status = :status', { status: filters.status });
    }
    if (filters?.jobId) {
      qb.andWhere('exec.job_id = :jobId', { jobId: filters.jobId });
    }
    if (filters?.dateFrom) {
      qb.andWhere('exec.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters?.dateTo) {
      qb.andWhere('exec.created_at <= :dateTo', { dateTo: filters.dateTo });
    }

    qb.orderBy('exec.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async hasPendingOrRunning(jobId: string, scheduledAt: Date): Promise<boolean> {
    const count = await this.execRepo.count({
      where: [
        { jobId, scheduledAt, status: 'pending' as const },
        { jobId, scheduledAt, status: 'running' as const },
      ],
    });
    return count > 0;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/executions/executions.service.spec.ts --no-cache`
Expected: All 4 tests pass

- [ ] **Step 5: Implement LogsService**

Create `apps/platform/src/modules/executions/logs.service.ts`:
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Execution } from './execution.entity';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Execution) private execRepo: Repository<Execution>,
  ) {}

  async findByProject(
    projectId: string,
    filters?: {
      jobId?: string;
      dateFrom?: string;
      dateTo?: string;
      q?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;

    const qb = this.execRepo
      .createQueryBuilder('exec')
      .innerJoin('exec.job', 'job')
      .select([
        'exec.id',
        'exec.jobId',
        'exec.logs',
        'exec.createdAt',
        'job.name',
      ])
      .where('job.project_id = :projectId', { projectId })
      .andWhere("exec.logs != '[]'::jsonb");

    if (filters?.jobId) {
      qb.andWhere('exec.job_id = :jobId', { jobId: filters.jobId });
    }
    if (filters?.dateFrom) {
      qb.andWhere('exec.created_at >= :dateFrom', { dateFrom: filters.dateFrom });
    }
    if (filters?.dateTo) {
      qb.andWhere('exec.created_at <= :dateTo', { dateTo: filters.dateTo });
    }
    if (filters?.q) {
      qb.andWhere(
        "EXISTS (SELECT 1 FROM jsonb_array_elements(exec.logs) AS log WHERE log->>'message' ILIKE :q)",
        { q: `%${filters.q}%` },
      );
    }

    qb.orderBy('exec.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [executions, total] = await qb.getManyAndCount();

    // Flatten logs across executions
    const logs = executions.flatMap((exec) =>
      exec.logs.map((log) => ({
        executionId: exec.id,
        jobId: exec.jobId,
        jobName: (exec as any).job?.name,
        timestamp: log.timestamp,
        message: log.message,
      })),
    );

    return { items: logs, total, page, limit };
  }
}
```

- [ ] **Step 6: Create ExecutionsController and LogsController**

Create `apps/platform/src/modules/executions/executions.controller.ts`:
```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { ExecutionsService } from './executions.service';

@UseGuards(ApiKeyGuard)
@Controller('api/v1')
export class ExecutionsApiController {
  constructor(private executionsService: ExecutionsService) {}

  @Get('jobs/:jobId/executions')
  findByJob(
    @Param('jobId') jobId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.executionsService.findByJob(
      jobId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get('executions/:id')
  findOne(@Param('id') id: string) {
    return this.executionsService.findOne(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId')
export class ExecutionsDashboardController {
  constructor(
    private executionsService: ExecutionsService,
    private projectsService: ProjectsService,
  ) {}

  @Get('executions')
  async findByProject(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('status') status?: string,
    @Query('jobId') jobId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.executionsService.findByProject(projectId, {
      status,
      jobId,
      dateFrom,
      dateTo,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
    });
  }

  @Get('executions/:id')
  async findOne(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.executionsService.findOne(id);
  }
}
```

Create `apps/platform/src/modules/executions/logs.controller.ts`:
```typescript
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { LogsService } from './logs.service';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/logs')
export class LogsController {
  constructor(
    private logsService: LogsService,
    private projectsService: ProjectsService,
  ) {}

  @Get()
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('jobId') jobId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.logsService.findByProject(projectId, {
      jobId,
      dateFrom,
      dateTo,
      q,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
    });
  }
}
```

- [ ] **Step 7: Create ExecutionsModule**

Create `apps/platform/src/modules/executions/executions.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Execution } from './execution.entity';
import { ExecutionsService } from './executions.service';
import { LogsService } from './logs.service';
import { ExecutionsApiController, ExecutionsDashboardController } from './executions.controller';
import { LogsController } from './logs.controller';
import { ProjectsModule } from '../projects/projects.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Execution]),
    ProjectsModule,
    AuthModule,
  ],
  controllers: [ExecutionsApiController, ExecutionsDashboardController, LogsController],
  providers: [ExecutionsService, LogsService],
  exports: [ExecutionsService],
})
export class ExecutionsModule {}
```

- [ ] **Step 8: Commit**

```bash
git add apps/platform/src/modules/executions/
git commit -m "feat(executions): add executions and logs services with project-wide queries"
```

---

## Task 7: Registration (SDK Upsert)

**Files:**
- Create: `apps/platform/src/modules/projects/dto/register.dto.ts`
- Create: `apps/platform/src/modules/projects/registration.service.ts`
- Create: `apps/platform/src/modules/projects/registration.service.spec.ts`
- Create: `apps/platform/src/modules/projects/registration.controller.ts`

- [ ] **Step 1: Create DTO**

Create `apps/platform/src/modules/projects/dto/register.dto.ts`:
```typescript
import {
  IsString,
  IsUUID,
  IsArray,
  ValidateNested,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class FunctionOptionsDto {
  @IsInt()
  @IsOptional()
  @Min(0)
  retries?: number;

  @IsString()
  @IsOptional()
  timeout?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  concurrency?: number;
}

class FunctionMetadataDto {
  @IsString()
  name: string;

  @IsEnum(['cron', 'task'])
  type: 'cron' | 'task';

  @IsString()
  @IsOptional()
  schedule?: string;

  @ValidateNested()
  @Type(() => FunctionOptionsDto)
  @IsOptional()
  options?: FunctionOptionsDto;
}

export class RegisterDto {
  @IsUUID()
  project_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FunctionMetadataDto)
  functions: FunctionMetadataDto[];
}
```

- [ ] **Step 2: Write failing tests for RegistrationService**

Create `apps/platform/src/modules/projects/registration.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { Job } from '../jobs/job.entity';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let jobRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    jobRepo = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      createQueryBuilder: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: getRepositoryToken(Job), useValue: jobRepo },
      ],
    }).compile();

    service = module.get(RegistrationService);
  });

  describe('register', () => {
    it('should create new cron jobs', async () => {
      jobRepo.findOne.mockResolvedValue(null);
      jobRepo.create.mockReturnValue({ id: 'job-1', name: 'send-emails', status: 'active' });
      jobRepo.save.mockImplementation((j) => Promise.resolve({ id: 'job-1', ...j }));

      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      jobRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.register('proj-1', [
        {
          name: 'send-emails',
          type: 'cron' as const,
          schedule: '*/15 * * * *',
          options: { retries: 3 },
        },
      ]);

      expect(result.jobs).toHaveLength(1);
      expect(result.jobs[0].name).toBe('send-emails');
      expect(result.jobs[0].status).toBe('active');
    });

    it('should update existing jobs', async () => {
      const existing = {
        id: 'job-1',
        name: 'send-emails',
        schedule: '*/30 * * * *',
        status: 'inactive',
        source: 'sdk',
      };
      jobRepo.findOne.mockResolvedValue(existing);
      jobRepo.save.mockImplementation((j) => Promise.resolve(j));

      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      jobRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.register('proj-1', [
        {
          name: 'send-emails',
          type: 'cron' as const,
          schedule: '*/15 * * * *',
          options: {},
        },
      ]);

      expect(result.jobs[0].status).toBe('active');
      expect(jobRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ schedule: '*/15 * * * *', status: 'active' }),
      );
    });

    it('should store task-type functions with null schedule', async () => {
      jobRepo.findOne.mockResolvedValue(null);
      jobRepo.create.mockReturnValue({ id: 'job-1', name: 'send-email', status: 'active' });
      jobRepo.save.mockImplementation((j) => Promise.resolve({ id: 'job-1', ...j }));

      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      jobRepo.createQueryBuilder.mockReturnValue(qb);

      await service.register('proj-1', [
        { name: 'send-email', type: 'task' as const, options: { retries: 2 } },
      ]);

      expect(jobRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ schedule: null }),
      );
    });

    it('should deactivate stale SDK jobs not in the incoming list', async () => {
      jobRepo.findOne.mockResolvedValue(null);
      jobRepo.create.mockReturnValue({ id: 'job-1', name: 'keep-me', status: 'active' });
      jobRepo.save.mockImplementation((j) => Promise.resolve({ id: 'job-1', ...j }));

      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({}),
      };
      jobRepo.createQueryBuilder.mockReturnValue(qb);

      await service.register('proj-1', [
        { name: 'keep-me', type: 'cron' as const, schedule: '* * * * *', options: {} },
      ]);

      expect(qb.update).toHaveBeenCalled();
      expect(qb.set).toHaveBeenCalledWith({ status: 'inactive' });
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/projects/registration.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './registration.service'`

- [ ] **Step 4: Implement RegistrationService**

Create `apps/platform/src/modules/projects/registration.service.ts`:
```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { parseExpression } from 'cron-parser';
import { Job } from '../jobs/job.entity';

interface FunctionMetadata {
  name: string;
  type: 'cron' | 'task';
  schedule?: string;
  options?: {
    retries?: number;
    timeout?: string;
    concurrency?: number;
  };
}

@Injectable()
export class RegistrationService {
  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
  ) {}

  async register(projectId: string, functions: FunctionMetadata[]) {
    const results: Array<{ name: string; status: string }> = [];

    for (const fn of functions) {
      const existing = await this.jobRepo.findOne({
        where: { projectId, name: fn.name },
      });

      const timeoutStr = fn.options?.timeout;
      const timeoutSeconds = timeoutStr
        ? parseInt(timeoutStr.replace('s', ''))
        : 30;

      let nextRunAt: Date | null = null;
      if (fn.type === 'cron' && fn.schedule) {
        try {
          nextRunAt = parseExpression(fn.schedule).next().toDate();
        } catch {
          throw new BadRequestException(
            `Invalid cron expression for "${fn.name}": ${fn.schedule}`,
          );
        }
      }

      if (existing) {
        existing.schedule = fn.type === 'cron' ? fn.schedule : null;
        existing.status = 'active';
        existing.retries = fn.options?.retries ?? existing.retries;
        existing.timeoutSeconds = timeoutSeconds;
        existing.concurrency = fn.options?.concurrency ?? existing.concurrency;
        if (nextRunAt) existing.nextRunAt = nextRunAt;

        const saved = await this.jobRepo.save(existing);
        results.push({ name: saved.name, status: saved.status });
      } else {
        const job = this.jobRepo.create({
          projectId,
          name: fn.name,
          schedule: fn.type === 'cron' ? fn.schedule : null,
          source: 'sdk' as const,
          status: 'active' as const,
          retries: fn.options?.retries ?? 0,
          timeoutSeconds,
          concurrency: fn.options?.concurrency ?? 1,
          nextRunAt,
        });
        const saved = await this.jobRepo.save(job);
        results.push({ name: saved.name, status: saved.status });
      }
    }

    // Deactivate stale SDK jobs not in the incoming list
    const incomingNames = functions.map((f) => f.name);
    await this.jobRepo
      .createQueryBuilder()
      .update(Job)
      .set({ status: 'inactive' })
      .where('project_id = :projectId', { projectId })
      .andWhere('source = :source', { source: 'sdk' })
      .andWhere('name NOT IN (:...names)', { names: incomingNames.length ? incomingNames : ['__none__'] })
      .execute();

    return { jobs: results };
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/projects/registration.service.spec.ts --no-cache`
Expected: All 4 tests pass

- [ ] **Step 6: Create RegistrationController**

Create `apps/platform/src/modules/projects/registration.controller.ts`:
```typescript
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { RegistrationService } from './registration.service';
import { RegisterDto } from './dto/register.dto';

@UseGuards(ApiKeyGuard)
@Controller('api/v1/register')
export class RegistrationController {
  constructor(private registrationService: RegistrationService) {}

  @Post()
  register(@Req() req: Request, @Body() dto: RegisterDto) {
    const { project } = req.user as any;
    if (project.id !== dto.project_id) {
      throw new ForbiddenException('API key does not belong to this project');
    }
    return this.registrationService.register(dto.project_id, dto.functions);
  }
}
```

- [ ] **Step 7: Update ProjectsModule to include registration**

Update `apps/platform/src/modules/projects/projects.module.ts` to add the registration controller and service:
```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from './project.entity';
import { Job } from '../jobs/job.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Project, Job]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ProjectsController, RegistrationController],
  providers: [ProjectsService, RegistrationService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
```

- [ ] **Step 8: Commit**

```bash
git add apps/platform/src/modules/projects/
git commit -m "feat(registration): add SDK function upsert with stale job deactivation"
```

---

## Task 8: Queue Module (pgboss)

**Files:**
- Create: `apps/platform/src/modules/queue/queue.service.ts`
- Create: `apps/platform/src/modules/queue/queue.service.spec.ts`
- Create: `apps/platform/src/modules/queue/queue.module.ts`

- [ ] **Step 1: Write failing tests for QueueService**

Create `apps/platform/src/modules/queue/queue.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { QueueService } from './queue.service';

describe('QueueService', () => {
  let service: QueueService;
  let mockBoss: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockBoss = {
      start: jest.fn().mockResolvedValue(undefined),
      stop: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue('msg-id-1'),
      work: jest.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: 'PG_BOSS_INSTANCE', useValue: mockBoss },
      ],
    }).compile();

    service = module.get(QueueService);
  });

  describe('send', () => {
    it('should send a message to pgboss', async () => {
      const data = { executionId: 'exec-1', jobId: 'job-1' };
      const result = await service.send('pingback-execution', data);

      expect(mockBoss.send).toHaveBeenCalledWith(
        'pingback-execution',
        data,
        undefined,
      );
      expect(result).toBe('msg-id-1');
    });

    it('should pass options like startAfter for delayed jobs', async () => {
      const data = { executionId: 'exec-1' };
      await service.send('pingback-execution', data, { startAfter: 30 });

      expect(mockBoss.send).toHaveBeenCalledWith(
        'pingback-execution',
        data,
        { startAfter: 30 },
      );
    });
  });

  describe('work', () => {
    it('should register a worker handler', async () => {
      const handler = jest.fn();
      await service.work('pingback-execution', handler);

      expect(mockBoss.work).toHaveBeenCalledWith(
        'pingback-execution',
        handler,
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/queue/queue.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './queue.service'`

- [ ] **Step 3: Implement QueueService**

Create `apps/platform/src/modules/queue/queue.service.ts`:
```typescript
import {
  Injectable,
  Inject,
  OnModuleDestroy,
} from '@nestjs/common';
import PgBoss from 'pg-boss';

@Injectable()
export class QueueService implements OnModuleDestroy {
  constructor(@Inject('PG_BOSS_INSTANCE') private boss: PgBoss) {}

  async send(
    name: string,
    data: Record<string, any>,
    options?: { startAfter?: number },
  ) {
    return this.boss.send(name, data, options);
  }

  async work(name: string, handler: (job: PgBoss.Job) => Promise<void>) {
    return this.boss.work(name, handler);
  }

  async onModuleDestroy() {
    await this.boss.stop();
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/queue/queue.service.spec.ts --no-cache`
Expected: All 3 tests pass

- [ ] **Step 5: Create QueueModule**

Create `apps/platform/src/modules/queue/queue.module.ts`:
```typescript
import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import PgBoss from 'pg-boss';
import { QueueService } from './queue.service';

@Global()
@Module({
  providers: [
    {
      provide: 'PG_BOSS_INSTANCE',
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const boss = new PgBoss(config.get<string>('database.url'));
        await boss.start();
        return boss;
      },
    },
    QueueService,
  ],
  exports: [QueueService],
})
export class QueueModule {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/modules/queue/
git commit -m "feat(queue): add pgboss queue module with send/work wrapper"
```

---

## Task 9: Scheduler

**Files:**
- Create: `apps/platform/src/modules/scheduler/scheduler.service.ts`
- Create: `apps/platform/src/modules/scheduler/scheduler.service.spec.ts`
- Create: `apps/platform/src/modules/scheduler/scheduler.module.ts`

- [ ] **Step 1: Write failing tests for SchedulerService**

Create `apps/platform/src/modules/scheduler/scheduler.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { Job } from '../jobs/job.entity';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';

describe('SchedulerService', () => {
  let service: SchedulerService;
  let jobRepo: Record<string, jest.Mock>;
  let executionsService: Record<string, jest.Mock>;
  let queueService: Record<string, jest.Mock>;

  beforeEach(async () => {
    jobRepo = {
      find: jest.fn(),
      save: jest.fn(),
    };
    executionsService = {
      createPending: jest.fn(),
      hasPendingOrRunning: jest.fn(),
    };
    queueService = {
      send: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: ExecutionsService, useValue: executionsService },
        { provide: QueueService, useValue: queueService },
      ],
    }).compile();

    service = module.get(SchedulerService);
  });

  describe('tick', () => {
    it('should enqueue due jobs and advance next_run_at', async () => {
      const dueJob = {
        id: 'job-1',
        projectId: 'proj-1',
        name: 'send-emails',
        schedule: '*/15 * * * *',
        status: 'active',
        nextRunAt: new Date(Date.now() - 1000),
        retries: 3,
        timeoutSeconds: 60,
        concurrency: 1,
        project: {
          id: 'proj-1',
          endpointUrl: 'https://myapp.com/api/__pingback',
          cronSecret: 'secret123',
        },
      };

      jobRepo.find.mockResolvedValue([dueJob]);
      executionsService.hasPendingOrRunning.mockResolvedValue(false);
      executionsService.createPending.mockResolvedValue({
        id: 'exec-1',
        status: 'pending',
      });
      queueService.send.mockResolvedValue('msg-1');
      jobRepo.save.mockResolvedValue(dueJob);

      await service.tick();

      expect(executionsService.createPending).toHaveBeenCalledWith(
        'job-1',
        dueJob.nextRunAt,
      );
      expect(queueService.send).toHaveBeenCalledWith(
        'pingback-execution',
        expect.objectContaining({
          executionId: 'exec-1',
          jobId: 'job-1',
          functionName: 'send-emails',
        }),
      );
      expect(jobRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          nextRunAt: expect.any(Date),
          lastRunAt: expect.any(Date),
        }),
      );
    });

    it('should skip jobs that already have pending executions', async () => {
      const dueJob = {
        id: 'job-1',
        projectId: 'proj-1',
        name: 'send-emails',
        schedule: '*/15 * * * *',
        nextRunAt: new Date(Date.now() - 1000),
        project: { id: 'proj-1', endpointUrl: 'https://x.com', cronSecret: 's' },
      };

      jobRepo.find.mockResolvedValue([dueJob]);
      executionsService.hasPendingOrRunning.mockResolvedValue(true);

      await service.tick();

      expect(executionsService.createPending).not.toHaveBeenCalled();
      expect(queueService.send).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/scheduler/scheduler.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './scheduler.service'`

- [ ] **Step 3: Implement SchedulerService**

Create `apps/platform/src/modules/scheduler/scheduler.service.ts`:
```typescript
import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull, Not } from 'typeorm';
import { parseExpression } from 'cron-parser';
import { Job } from '../jobs/job.entity';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';
import { QueueMessage } from '@pingback/shared-types';

const TICK_INTERVAL_MS = 10_000;

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private intervalRef: NodeJS.Timeout;
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    private executionsService: ExecutionsService,
    private queueService: QueueService,
  ) {}

  onModuleInit() {
    this.intervalRef = setInterval(() => this.tick(), TICK_INTERVAL_MS);
    this.logger.log('Scheduler started (10s tick)');
  }

  onModuleDestroy() {
    if (this.intervalRef) clearInterval(this.intervalRef);
  }

  async tick() {
    try {
      const dueJobs = await this.jobRepo.find({
        where: {
          status: 'active' as const,
          nextRunAt: LessThanOrEqual(new Date()),
          schedule: Not(IsNull()),
        },
        relations: ['project'],
      });

      for (const job of dueJobs) {
        try {
          const duplicate = await this.executionsService.hasPendingOrRunning(
            job.id,
            job.nextRunAt,
          );
          if (duplicate) continue;

          const execution = await this.executionsService.createPending(
            job.id,
            job.nextRunAt,
          );

          const message: QueueMessage = {
            executionId: execution.id,
            jobId: job.id,
            projectId: job.projectId,
            functionName: job.name,
            endpointUrl: job.project.endpointUrl,
            cronSecret: job.project.cronSecret,
            attempt: 1,
            maxRetries: job.retries,
            timeoutSeconds: job.timeoutSeconds,
            scheduledAt: job.nextRunAt.toISOString(),
          };

          await this.queueService.send('pingback-execution', message);

          // Advance next_run_at
          const next = parseExpression(job.schedule).next().toDate();
          job.nextRunAt = next;
          job.lastRunAt = new Date();
          await this.jobRepo.save(job);
        } catch (err) {
          this.logger.error(`Failed to process job ${job.id}: ${err.message}`);
        }
      }
    } catch (err) {
      this.logger.error(`Scheduler tick failed: ${err.message}`);
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/scheduler/scheduler.service.spec.ts --no-cache`
Expected: All 2 tests pass

- [ ] **Step 5: Create SchedulerModule**

Create `apps/platform/src/modules/scheduler/scheduler.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/job.entity';
import { SchedulerService } from './scheduler.service';
import { ExecutionsModule } from '../executions/executions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Job]), ExecutionsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/modules/scheduler/
git commit -m "feat(scheduler): add 10s tick loop that enqueues due jobs via pgboss"
```

---

## Task 10: Worker

**Files:**
- Create: `apps/platform/src/modules/worker/worker.service.ts`
- Create: `apps/platform/src/modules/worker/worker.service.spec.ts`
- Create: `apps/platform/src/modules/worker/worker.module.ts`

- [ ] **Step 1: Write failing tests for WorkerService**

Create `apps/platform/src/modules/worker/worker.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { WorkerService } from './worker.service';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';
import { AlertsService } from '../alerts/alerts.service';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('WorkerService', () => {
  let service: WorkerService;
  let executionsService: Record<string, jest.Mock>;
  let queueService: Record<string, jest.Mock>;
  let alertsService: Record<string, jest.Mock>;

  beforeEach(async () => {
    executionsService = {
      markRunning: jest.fn(),
      markCompleted: jest.fn(),
    };
    queueService = {
      work: jest.fn(),
      send: jest.fn(),
    };
    alertsService = {
      evaluate: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        WorkerService,
        { provide: ExecutionsService, useValue: executionsService },
        { provide: QueueService, useValue: queueService },
        { provide: AlertsService, useValue: alertsService },
      ],
    }).compile();

    service = module.get(WorkerService);
    mockFetch.mockReset();
  });

  describe('processJob', () => {
    const baseMessage = {
      executionId: 'exec-1',
      jobId: 'job-1',
      projectId: 'proj-1',
      functionName: 'send-emails',
      endpointUrl: 'https://myapp.com/api/__pingback',
      cronSecret: 'secret123',
      attempt: 1,
      maxRetries: 3,
      timeoutSeconds: 30,
      scheduledAt: '2026-04-17T12:00:00.000Z',
    };

    it('should mark execution as success on 2xx response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.resolve(JSON.stringify({
          status: 'success',
          result: { processed: 5 },
          logs: [{ timestamp: 1, message: 'done' }],
          durationMs: 123,
        })),
      });

      await service.processJob({ data: baseMessage } as any);

      expect(executionsService.markRunning).toHaveBeenCalledWith('exec-1');
      expect(executionsService.markCompleted).toHaveBeenCalledWith(
        'exec-1',
        expect.objectContaining({ status: 'success', httpStatus: 200 }),
      );
      expect(alertsService.evaluate).not.toHaveBeenCalled();
    });

    it('should mark execution as failed and retry on non-2xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Internal Server Error'),
      });

      await service.processJob({ data: baseMessage } as any);

      expect(executionsService.markCompleted).toHaveBeenCalledWith(
        'exec-1',
        expect.objectContaining({ status: 'failed', httpStatus: 500 }),
      );
      expect(queueService.send).toHaveBeenCalledWith(
        'pingback-execution',
        expect.objectContaining({ attempt: 2 }),
        expect.objectContaining({ startAfter: expect.any(Number) }),
      );
      expect(alertsService.evaluate).toHaveBeenCalled();
    });

    it('should not retry when max retries reached', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Error'),
      });

      const maxedMessage = { ...baseMessage, attempt: 3, maxRetries: 3 };
      await service.processJob({ data: maxedMessage } as any);

      expect(queueService.send).not.toHaveBeenCalled();
      expect(alertsService.evaluate).toHaveBeenCalled();
    });

    it('should handle fetch timeout/network errors', async () => {
      mockFetch.mockRejectedValue(new Error('fetch failed'));

      await service.processJob({ data: baseMessage } as any);

      expect(executionsService.markCompleted).toHaveBeenCalledWith(
        'exec-1',
        expect.objectContaining({
          status: 'failed',
          errorMessage: 'fetch failed',
        }),
      );
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/worker/worker.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './worker.service'`

- [ ] **Step 3: Implement WorkerService**

Create `apps/platform/src/modules/worker/worker.service.ts`:
```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createHmac } from 'crypto';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';
import { AlertsService } from '../alerts/alerts.service';
import { QueueMessage } from '@pingback/shared-types';

@Injectable()
export class WorkerService implements OnModuleInit {
  private readonly logger = new Logger(WorkerService.name);

  constructor(
    private executionsService: ExecutionsService,
    private queueService: QueueService,
    private alertsService: AlertsService,
  ) {}

  onModuleInit() {
    this.queueService.work('pingback-execution', (job) =>
      this.processJob(job),
    );
    this.logger.log('Worker subscribed to pingback-execution queue');
  }

  async processJob(job: { data: QueueMessage }) {
    const msg = job.data;

    try {
      await this.executionsService.markRunning(msg.executionId);

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = JSON.stringify({
        function: msg.functionName,
        executionId: msg.executionId,
        attempt: msg.attempt,
        scheduledAt: msg.scheduledAt,
      });

      const signature = createHmac('sha256', msg.cronSecret)
        .update(`${timestamp}.${body}`)
        .digest('hex');

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        msg.timeoutSeconds * 1000,
      );

      try {
        const response = await fetch(msg.endpointUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Pingback-Signature': signature,
            'X-Pingback-Timestamp': timestamp,
          },
          body,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        const responseText = await response.text();

        if (response.ok) {
          let logs: Array<{ timestamp: number; message: string }> = [];
          try {
            const parsed = JSON.parse(responseText);
            logs = parsed.logs || [];
          } catch {}

          await this.executionsService.markCompleted(msg.executionId, {
            status: 'success',
            httpStatus: response.status,
            responseBody: responseText,
            logs,
          });
        } else {
          await this.executionsService.markCompleted(msg.executionId, {
            status: 'failed',
            httpStatus: response.status,
            responseBody: responseText,
            errorMessage: `HTTP ${response.status}`,
          });

          await this.handleFailure(msg);
        }
      } catch (err) {
        clearTimeout(timeout);
        await this.executionsService.markCompleted(msg.executionId, {
          status: 'failed',
          errorMessage: err.message,
        });

        await this.handleFailure(msg);
      }
    } catch (err) {
      this.logger.error(
        `Worker error for execution ${msg.executionId}: ${err.message}`,
      );
    }
  }

  private async handleFailure(msg: QueueMessage) {
    // Retry with exponential backoff
    if (msg.attempt < msg.maxRetries) {
      const backoffSeconds = Math.min(Math.pow(2, msg.attempt), 60);
      await this.queueService.send(
        'pingback-execution',
        { ...msg, attempt: msg.attempt + 1 },
        { startAfter: backoffSeconds },
      );
    }

    // Evaluate alerts
    await this.alertsService.evaluate(msg.jobId, msg.executionId);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/worker/worker.service.spec.ts --no-cache`
Expected: All 4 tests pass

- [ ] **Step 5: Create WorkerModule**

Create `apps/platform/src/modules/worker/worker.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { ExecutionsModule } from '../executions/executions.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [ExecutionsModule, AlertsModule],
  providers: [WorkerService],
})
export class WorkerModule {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/platform/src/modules/worker/
git commit -m "feat(worker): add execution processor with HTTP dispatch, retries, and alert evaluation"
```

---

## Task 11: Alerts Module

**Files:**
- Create: `apps/platform/src/modules/alerts/dto/create-alert.dto.ts`
- Create: `apps/platform/src/modules/alerts/dto/update-alert.dto.ts`
- Create: `apps/platform/src/modules/alerts/notifiers/email.notifier.ts`
- Create: `apps/platform/src/modules/alerts/alerts.service.ts`
- Create: `apps/platform/src/modules/alerts/alerts.service.spec.ts`
- Create: `apps/platform/src/modules/alerts/alerts.controller.ts`
- Create: `apps/platform/src/modules/alerts/alerts.module.ts`

- [ ] **Step 1: Create DTOs**

Create `apps/platform/src/modules/alerts/dto/create-alert.dto.ts`:
```typescript
import { IsString, IsEnum, IsInt, IsOptional, IsUUID, IsBoolean, Min } from 'class-validator';

export class CreateAlertDto {
  @IsUUID()
  @IsOptional()
  jobId?: string;

  @IsEnum(['email'])
  channel: 'email';

  @IsString()
  target: string;

  @IsEnum(['consecutive_failures', 'duration_exceeded', 'missed_run'])
  triggerType: 'consecutive_failures' | 'duration_exceeded' | 'missed_run';

  @IsInt()
  @Min(1)
  triggerValue: number;

  @IsInt()
  @IsOptional()
  @Min(60)
  cooldownSeconds?: number;
}
```

Create `apps/platform/src/modules/alerts/dto/update-alert.dto.ts`:
```typescript
import { IsString, IsEnum, IsInt, IsOptional, IsBoolean, Min } from 'class-validator';

export class UpdateAlertDto {
  @IsString()
  @IsOptional()
  target?: string;

  @IsEnum(['consecutive_failures', 'duration_exceeded', 'missed_run'])
  @IsOptional()
  triggerType?: 'consecutive_failures' | 'duration_exceeded' | 'missed_run';

  @IsInt()
  @IsOptional()
  @Min(1)
  triggerValue?: number;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsInt()
  @IsOptional()
  @Min(60)
  cooldownSeconds?: number;
}
```

- [ ] **Step 2: Create EmailNotifier**

Create `apps/platform/src/modules/alerts/notifiers/email.notifier.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailNotifier {
  private resend: Resend;
  private dashboardUrl: string;
  private readonly logger = new Logger(EmailNotifier.name);

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('resend.apiKey');
    this.resend = new Resend(apiKey);
    this.dashboardUrl = this.config.get<string>('dashboardUrl');
  }

  async send(params: {
    to: string;
    jobName: string;
    projectName: string;
    errorMessage: string;
    attempt: number;
    executionId: string;
    projectId: string;
  }) {
    try {
      await this.resend.emails.send({
        from: 'Pingback <alerts@pingback.dev>',
        to: params.to,
        subject: `[Pingback] Job "${params.jobName}" failed`,
        html: `
          <h2>Job Failure Alert</h2>
          <p><strong>Job:</strong> ${params.jobName}</p>
          <p><strong>Project:</strong> ${params.projectName}</p>
          <p><strong>Error:</strong> ${params.errorMessage}</p>
          <p><strong>Attempt:</strong> ${params.attempt}</p>
          <p><a href="${this.dashboardUrl}/projects/${params.projectId}/executions/${params.executionId}">View Execution</a></p>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send alert email: ${err.message}`);
    }
  }
}
```

- [ ] **Step 3: Write failing tests for AlertsService**

Create `apps/platform/src/modules/alerts/alerts.service.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlertsService } from './alerts.service';
import { Alert } from './alert.entity';
import { Execution } from '../executions/execution.entity';
import { Job } from '../jobs/job.entity';
import { EmailNotifier } from './notifiers/email.notifier';

describe('AlertsService', () => {
  let service: AlertsService;
  let alertRepo: Record<string, jest.Mock>;
  let execRepo: Record<string, jest.Mock>;
  let jobRepo: Record<string, jest.Mock>;
  let emailNotifier: Record<string, jest.Mock>;

  beforeEach(async () => {
    alertRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
    };
    execRepo = {
      find: jest.fn(),
      findOne: jest.fn(),
    };
    jobRepo = {
      findOne: jest.fn(),
    };
    emailNotifier = {
      send: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        AlertsService,
        { provide: getRepositoryToken(Alert), useValue: alertRepo },
        { provide: getRepositoryToken(Execution), useValue: execRepo },
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: EmailNotifier, useValue: emailNotifier },
      ],
    }).compile();

    service = module.get(AlertsService);
  });

  describe('evaluate', () => {
    it('should fire email for consecutive_failures when threshold met', async () => {
      const job = {
        id: 'job-1',
        name: 'send-emails',
        projectId: 'proj-1',
        project: { id: 'proj-1', name: 'My App' },
      };
      const execution = {
        id: 'exec-1',
        jobId: 'job-1',
        status: 'failed',
        errorMessage: 'HTTP 500',
        attempt: 1,
      };

      jobRepo.findOne.mockResolvedValue(job);
      execRepo.findOne.mockResolvedValue(execution);

      alertRepo.find.mockResolvedValue([
        {
          id: 'alert-1',
          projectId: 'proj-1',
          jobId: null,
          channel: 'email',
          target: 'dev@test.com',
          triggerType: 'consecutive_failures',
          triggerValue: 2,
          enabled: true,
          lastFiredAt: null,
          cooldownSeconds: 3600,
        },
      ]);

      // Last 2 executions are both failures
      execRepo.find.mockResolvedValue([
        { status: 'failed' },
        { status: 'failed' },
      ]);

      await service.evaluate('job-1', 'exec-1');

      expect(emailNotifier.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'dev@test.com',
          jobName: 'send-emails',
        }),
      );
      expect(alertRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({ lastFiredAt: expect.any(Date) }),
      );
    });

    it('should respect cooldown period', async () => {
      const job = {
        id: 'job-1',
        name: 'send-emails',
        projectId: 'proj-1',
        project: { id: 'proj-1', name: 'My App' },
      };
      const execution = { id: 'exec-1', status: 'failed', errorMessage: 'err', attempt: 1 };

      jobRepo.findOne.mockResolvedValue(job);
      execRepo.findOne.mockResolvedValue(execution);

      alertRepo.find.mockResolvedValue([
        {
          id: 'alert-1',
          projectId: 'proj-1',
          jobId: null,
          channel: 'email',
          target: 'dev@test.com',
          triggerType: 'consecutive_failures',
          triggerValue: 1,
          enabled: true,
          lastFiredAt: new Date(), // Just fired
          cooldownSeconds: 3600,
        },
      ]);

      execRepo.find.mockResolvedValue([{ status: 'failed' }]);

      await service.evaluate('job-1', 'exec-1');

      expect(emailNotifier.send).not.toHaveBeenCalled();
    });

    it('should fire for duration_exceeded', async () => {
      const job = {
        id: 'job-1',
        name: 'slow-job',
        projectId: 'proj-1',
        project: { id: 'proj-1', name: 'My App' },
      };
      const execution = {
        id: 'exec-1',
        status: 'failed',
        errorMessage: 'timeout',
        attempt: 1,
        durationMs: 120000,
      };

      jobRepo.findOne.mockResolvedValue(job);
      execRepo.findOne.mockResolvedValue(execution);

      alertRepo.find.mockResolvedValue([
        {
          id: 'alert-1',
          projectId: 'proj-1',
          jobId: 'job-1',
          channel: 'email',
          target: 'dev@test.com',
          triggerType: 'duration_exceeded',
          triggerValue: 60, // 60 seconds
          enabled: true,
          lastFiredAt: null,
          cooldownSeconds: 3600,
        },
      ]);

      await service.evaluate('job-1', 'exec-1');

      expect(emailNotifier.send).toHaveBeenCalled();
    });
  });

  describe('CRUD', () => {
    it('should create an alert', async () => {
      alertRepo.create.mockReturnValue({ id: 'alert-1' });
      alertRepo.save.mockResolvedValue({ id: 'alert-1' });

      const result = await service.create('proj-1', {
        channel: 'email',
        target: 'dev@test.com',
        triggerType: 'consecutive_failures',
        triggerValue: 3,
      });

      expect(result).toHaveProperty('id');
    });

    it('should list alerts by project', async () => {
      alertRepo.find.mockResolvedValue([{ id: 'alert-1' }]);

      const result = await service.findAllByProject('proj-1');

      expect(result).toHaveLength(1);
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/alerts/alerts.service.spec.ts --no-cache`
Expected: FAIL — `Cannot find module './alerts.service'`

- [ ] **Step 5: Implement AlertsService**

Create `apps/platform/src/modules/alerts/alerts.service.ts`:
```typescript
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { Execution } from '../executions/execution.entity';
import { Job } from '../jobs/job.entity';
import { EmailNotifier } from './notifiers/email.notifier';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(Alert) private alertRepo: Repository<Alert>,
    @InjectRepository(Execution) private execRepo: Repository<Execution>,
    @InjectRepository(Job) private jobRepo: Repository<Job>,
    private emailNotifier: EmailNotifier,
  ) {}

  async evaluate(jobId: string, executionId: string) {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['project'],
    });
    if (!job) return;

    const execution = await this.execRepo.findOne({
      where: { id: executionId },
    });
    if (!execution) return;

    const alerts = await this.alertRepo.find({
      where: [
        { projectId: job.projectId, jobId: null, enabled: true },
        { projectId: job.projectId, jobId, enabled: true },
      ],
    });

    for (const alert of alerts) {
      if (this.isInCooldown(alert)) continue;

      let shouldFire = false;

      switch (alert.triggerType) {
        case 'consecutive_failures':
          shouldFire = await this.checkConsecutiveFailures(
            jobId,
            alert.triggerValue,
          );
          break;
        case 'duration_exceeded':
          shouldFire =
            execution.durationMs != null &&
            execution.durationMs > alert.triggerValue * 1000;
          break;
        case 'missed_run':
          // Handled in scheduler tick, not inline
          continue;
      }

      if (shouldFire) {
        await this.emailNotifier.send({
          to: alert.target,
          jobName: job.name,
          projectName: job.project.name,
          errorMessage: execution.errorMessage || 'Unknown error',
          attempt: execution.attempt,
          executionId: execution.id,
          projectId: job.projectId,
        });

        alert.lastFiredAt = new Date();
        await this.alertRepo.save(alert);
      }
    }
  }

  private isInCooldown(alert: Alert): boolean {
    if (!alert.lastFiredAt) return false;
    const cooldownUntil =
      alert.lastFiredAt.getTime() + alert.cooldownSeconds * 1000;
    return Date.now() < cooldownUntil;
  }

  private async checkConsecutiveFailures(
    jobId: string,
    threshold: number,
  ): Promise<boolean> {
    const recent = await this.execRepo.find({
      where: { jobId },
      order: { createdAt: 'DESC' },
      take: threshold,
    });
    return (
      recent.length >= threshold &&
      recent.every((e) => e.status === 'failed')
    );
  }

  // CRUD methods

  async create(projectId: string, dto: CreateAlertDto) {
    const alert = this.alertRepo.create({
      projectId,
      jobId: dto.jobId || null,
      channel: dto.channel,
      target: dto.target,
      triggerType: dto.triggerType,
      triggerValue: dto.triggerValue,
      cooldownSeconds: dto.cooldownSeconds ?? 3600,
    });
    return this.alertRepo.save(alert);
  }

  async findAllByProject(projectId: string, jobId?: string) {
    const where: any = { projectId };
    if (jobId) where.jobId = jobId;
    return this.alertRepo.find({ where });
  }

  async findOne(id: string, projectId: string) {
    const alert = await this.alertRepo.findOne({
      where: { id, projectId },
    });
    if (!alert) throw new NotFoundException('Alert not found');
    return alert;
  }

  async update(id: string, projectId: string, dto: UpdateAlertDto) {
    const alert = await this.findOne(id, projectId);
    Object.assign(alert, dto);
    return this.alertRepo.save(alert);
  }

  async remove(id: string, projectId: string) {
    await this.findOne(id, projectId);
    await this.alertRepo.delete(id);
  }
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest src/modules/alerts/alerts.service.spec.ts --no-cache`
Expected: All 5 tests pass

- [ ] **Step 7: Create AlertsController**

Create `apps/platform/src/modules/alerts/alerts.controller.ts`:
```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/alerts')
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: CreateAlertDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.create(projectId, dto);
  }

  @Get()
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('jobId') jobId?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.findAllByProject(projectId, jobId);
  }

  @Patch(':id')
  async update(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.update(id, projectId, dto);
  }

  @Delete(':id')
  async remove(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.remove(id, projectId);
  }
}
```

- [ ] **Step 8: Create AlertsModule**

Create `apps/platform/src/modules/alerts/alerts.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './alert.entity';
import { Execution } from '../executions/execution.entity';
import { Job } from '../jobs/job.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { EmailNotifier } from './notifiers/email.notifier';
import { ProjectsModule } from '../projects/projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Alert, Execution, Job]),
    ProjectsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, EmailNotifier],
  exports: [AlertsService],
})
export class AlertsModule {}
```

- [ ] **Step 9: Commit**

```bash
git add apps/platform/src/modules/alerts/
git commit -m "feat(alerts): add alert evaluation, email notifications, and CRUD endpoints"
```

---

## Task 12: Wire Everything in AppModule

**Files:**
- Modify: `apps/platform/src/app.module.ts`

- [ ] **Step 1: Update AppModule to import all modules**

Replace the contents of `apps/platform/src/app.module.ts` with:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { User } from './entities/user.entity';
import { Project } from './modules/projects/project.entity';
import { ApiKey } from './modules/api-keys/api-key.entity';
import { Job } from './modules/jobs/job.entity';
import { Execution } from './modules/executions/execution.entity';
import { Alert } from './modules/alerts/alert.entity';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectsModule } from './modules/projects/projects.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { ExecutionsModule } from './modules/executions/executions.module';
import { AlertsModule } from './modules/alerts/alerts.module';
import { QueueModule } from './modules/queue/queue.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { WorkerModule } from './modules/worker/worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('database.url'),
        entities: [User, Project, ApiKey, Job, Execution, Alert],
        synchronize: true,
      }),
    }),
    AuthModule,
    ProjectsModule,
    JobsModule,
    ExecutionsModule,
    AlertsModule,
    QueueModule,
    SchedulerModule,
    WorkerModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 2: Run all tests**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx jest --no-cache`
Expected: All tests pass

- [ ] **Step 3: Verify the app compiles**

Run: `cd /Users/cirx/Desktop/projects/personal/pingback/apps/platform && npx nest build`
Expected: Build succeeds with no errors

- [ ] **Step 4: Commit**

```bash
git add apps/platform/src/app.module.ts
git commit -m "feat: wire all modules into AppModule — Phase 1 platform complete"
```
