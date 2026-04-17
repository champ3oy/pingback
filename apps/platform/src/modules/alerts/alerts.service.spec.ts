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
          lastFiredAt: new Date(),
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
          triggerValue: 60,
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
