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
