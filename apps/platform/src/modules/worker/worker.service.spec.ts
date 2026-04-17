import { Test } from '@nestjs/testing';
import { WorkerService } from './worker.service';
import { ExecutionsService } from '../executions/executions.service';
import { QueueService } from '../queue/queue.service';
import { AlertsService } from '../alerts/alerts.service';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

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
