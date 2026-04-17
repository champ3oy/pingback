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
        { id: 'key-1', name: 'My Key', keyPrefix: 'pb_live_abc12345', keyHash: 'secret-hash', createdAt: new Date() },
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
