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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';
import { ApiKeyCreatedResponse, ApiKeyResponse } from './dto/api-key-response.dto';

@ApiTags('API Keys')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/api-keys')
export class ApiKeysController {
  constructor(
    private apiKeysService: ApiKeysService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new API key for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'API key created (raw key returned only once)', type: ApiKeyCreatedResponse })
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
  @ApiOperation({ summary: 'List all API keys for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'List of API keys', type: [ApiKeyResponse] })
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.apiKeysService.findAllByProject(projectId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke an API key' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'API key UUID' })
  @ApiResponse({ status: 200, description: 'API key revoked' })
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
