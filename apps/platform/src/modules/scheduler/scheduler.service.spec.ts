import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SchedulerService } from './scheduler.service';
import { Job } from '../jobs/job.entity';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';
import { AlertsService } from '../alerts/alerts.service';

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

    const alertsService = { evaluate: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        SchedulerService,
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: ExecutionsService, useValue: executionsService },
        { provide: QueueService, useValue: queueService },
        { provide: AlertsService, useValue: alertsService },
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

      const expectedScheduledAt = dueJob.nextRunAt;
      await service.tick();

      expect(executionsService.createPending).toHaveBeenCalledWith(
        'job-1',
        expectedScheduledAt,
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
