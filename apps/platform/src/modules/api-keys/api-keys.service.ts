import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { ApiKey } from './api-key.entity';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { API_KEY_PREFIX_LENGTH } from '../../common/constants';

@Injectable()
export class ApiKeysService {
  constructor(
    @InjectRepository(ApiKey) private apiKeyRepo: Repository<ApiKey>,
  ) {}

  async create(projectId: string, dto: CreateApiKeyDto) {
    const raw = `pb_live_${randomBytes(32).toString('hex')}`;
    const prefix = raw.substring(0, API_KEY_PREFIX_LENGTH);
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
