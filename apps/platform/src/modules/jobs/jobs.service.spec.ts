import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { Job } from './job.entity';
import { User } from '../../entities/user.entity';
import { PlanLimitsService } from '../subscription/plan-limits.service';

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

    const userRepo = { findOne: jest.fn() };
    const planLimitsService = { canCreateJob: jest.fn().mockResolvedValue({ allowed: true }), capRetries: jest.fn((_, r) => r) };

    const module = await Test.createTestingModule({
      providers: [
        JobsService,
        { provide: getRepositoryToken(Job), useValue: jobRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: PlanLimitsService, useValue: planLimitsService },
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

      await service.update('job-1', 'proj-1', {
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
