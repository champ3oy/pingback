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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('Projects')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({ status: 201, description: 'Project created' })
  create(@Req() req: Request, @Body() dto: CreateProjectDto) {
    const user = req.user as { id: string };
    return this.projectsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all projects for the authenticated user' })
  @ApiResponse({ status: 200, description: 'List of projects' })
  findAll(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.projectsService.findAllByUser(user.id);
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project by ID' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project details' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  findOne(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.projectsService.findOneByUser(projectId, user.id);
  }

  @Delete(':projectId')
  @ApiOperation({ summary: 'Delete a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 200, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  remove(@Req() req: Request, @Param('projectId') projectId: string) {
    const user = req.user as { id: string };
    return this.projectsService.remove(projectId, user.id);
  }
}
