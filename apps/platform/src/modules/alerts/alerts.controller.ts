import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjectsService } from '../projects/projects.service';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertResponse } from './dto/alert-response.dto';

@ApiTags('Alerts')
@ApiBearerAuth('jwt')
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/alerts')
export class AlertsController {
  constructor(
    private alertsService: AlertsService,
    private projectsService: ProjectsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new alert' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiResponse({ status: 201, description: 'Alert created', type: AlertResponse })
  async create(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Body() dto: CreateAlertDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.create(projectId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List alerts for a project' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiQuery({ name: 'jobId', required: false, description: 'Filter by job ID' })
  @ApiResponse({ status: 200, description: 'List of alerts', type: [AlertResponse] })
  async findAll(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Query('jobId') jobId?: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.findAllByProject(projectId, jobId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an alert' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Alert updated', type: AlertResponse })
  async update(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAlertDto,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.update(id, projectId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an alert' })
  @ApiParam({ name: 'projectId', description: 'Project UUID' })
  @ApiParam({ name: 'id', description: 'Alert UUID' })
  @ApiResponse({ status: 200, description: 'Alert deleted' })
  async remove(
    @Req() req: Request,
    @Param('projectId') projectId: string,
    @Param('id') id: string,
  ) {
    const user = req.user as { id: string };
    await this.projectsService.findOneByUser(projectId, user.id);
    return this.alertsService.remove(id, projectId);
  }
}
