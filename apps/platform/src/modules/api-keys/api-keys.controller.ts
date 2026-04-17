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
