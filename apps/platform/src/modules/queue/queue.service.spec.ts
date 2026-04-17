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
