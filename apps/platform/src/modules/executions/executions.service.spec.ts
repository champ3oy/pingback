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
      findAndCount: jest.fn(),
      count: jest.fn(),
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

    it('should include hasChildren=true when children exist', async () => {
      const exec = { id: 'exec-1', parentId: null, job: { name: 'test' } };
      execRepo.findOne.mockResolvedValue(exec);
      execRepo.count.mockResolvedValue(2);

      const result = await service.findOne('exec-1');

      expect(result.hasChildren).toBe(true);
    });

    it('should include hasChildren=false when no children', async () => {
      const exec = { id: 'exec-1', parentId: null, job: { name: 'test' } };
      execRepo.findOne.mockResolvedValue(exec);
      execRepo.count.mockResolvedValue(0);

      const result = await service.findOne('exec-1');

      expect(result.hasChildren).toBe(false);
    });
  });

  describe('getWorkflowTree', () => {
    it('should return full tree when given a leaf node', async () => {
      const root = { id: 'root', parentId: null, jobId: 'j1', status: 'success', durationMs: 100, attempt: 1, scheduledAt: new Date(), completedAt: new Date(), job: { name: 'step0', type: 'cron', retries: 0 } };
      const child = { id: 'child', parentId: 'root', jobId: 'j2', status: 'success', durationMs: 50, attempt: 1, scheduledAt: new Date(), completedAt: new Date(), job: { name: 'step1', type: 'task', retries: 2 } };
      const grandchild = { id: 'grandchild', parentId: 'child', jobId: 'j3', status: 'failed', durationMs: 30, attempt: 2, scheduledAt: new Date(), completedAt: new Date(), job: { name: 'step2', type: 'task', retries: 2 } };

      // findOne for the starting node (grandchild)
      execRepo.findOne.mockResolvedValueOnce(grandchild);
      // findOne walking up: child
      execRepo.findOne.mockResolvedValueOnce(child);
      // findOne walking up: root (parentId is null, stop)
      execRepo.findOne.mockResolvedValueOnce(root);

      // find descendants from root
      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([root, child, grandchild]),
      };
      execRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getWorkflowTree('grandchild');

      expect(result.rootId).toBe('root');
      expect(result.nodes).toHaveLength(3);
      expect(result.nodes[0].id).toBe('root');
      expect(result.nodes[0].functionName).toBe('step0');
      expect(result.nodes[2].id).toBe('grandchild');
      expect(result.nodes[2].parentId).toBe('child');
    });

    it('should return tree when given the root node', async () => {
      const root = { id: 'root', parentId: null, jobId: 'j1', status: 'success', durationMs: 100, attempt: 1, scheduledAt: new Date(), completedAt: new Date(), job: { name: 'step0', type: 'cron', retries: 0 } };
      const child = { id: 'child', parentId: 'root', jobId: 'j2', status: 'success', durationMs: 50, attempt: 1, scheduledAt: new Date(), completedAt: new Date(), job: { name: 'step1', type: 'task', retries: 2 } };

      // findOne for starting node (root) — parentId is null, no walk-up needed
      execRepo.findOne.mockResolvedValueOnce(root);

      const qb = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([root, child]),
      };
      execRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.getWorkflowTree('root');

      expect(result.rootId).toBe('root');
      expect(result.nodes).toHaveLength(2);
    });

    it('should throw NotFoundException for non-existent execution', async () => {
      execRepo.findOne.mockResolvedValue(null);

      await expect(service.getWorkflowTree('nope')).rejects.toThrow(NotFoundException);
    });
  });

  describe('hasPendingOrRunning', () => {
    it('should return true when pending/running execution exists', async () => {
      execRepo.count.mockResolvedValue(1);

      const result = await service.hasPendingOrRunning('job-1', new Date());

      expect(result).toBe(true);
    });

    it('should return false when no pending/running execution exists', async () => {
      execRepo.count.mockResolvedValue(0);

      const result = await service.hasPendingOrRunning('job-1', new Date());

      expect(result).toBe(false);
    });
  });
});
